const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY are required in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = process.env.TEST_EMAIL || 'patient_demo@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Password123!';

async function getToken() {
    console.log(`🔐 Authenticating as ${TEST_EMAIL}...`);

    // 1. Try to Sign In
    let { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
    });

    // 2. If user doesn't exist, Sign Up
    if (error && error.message.includes('Invalid login credentials')) {
        console.log('⚠️  User not found or wrong password. Attempting to create user...');

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        });

        if (signUpError) {
            console.error('❌ Sign Up Failed:', signUpError.message);
            process.exit(1);
        }

        if (signUpData.user) {
            console.log('✅ User created successfully!');
            // Auto-sign in happens on sign up usually, but let's be sure
            if (signUpData.session) {
                data = signUpData;
            } else {
                console.log('ℹ️  Check your email for confirmation link if required.');
                // Retry sign in just in case
                const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                    email: TEST_EMAIL,
                    password: TEST_PASSWORD,
                });
                if (retryError) {
                    console.error('❌ Could not sign in after creation (maybe email confirmation needed?):', retryError.message);
                    process.exit(1);
                }
                data = retryData;
            }
        }
    } else if (error) {
        console.error('❌ Sign In Failed:', error.message);
        process.exit(1);
    }

    if (data.session) {
        console.log('\n✅ Authentication Successful!');
        console.log('='.repeat(60));
        console.log('ACCESS TOKEN (Bearer Token):');
        console.log(data.session.access_token);
        console.log('='.repeat(60));
        console.log('\nUsage:');
        console.log(`export TOKEN=${data.session.access_token}`);
        console.log('node scripts/verify_protected_api.js');
    } else {
        console.error('❌ No session returned. Email confirmation might be required.');
    }
}

getToken();
