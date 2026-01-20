/**
 * Circle Wallet Setup Script
 * Registers Entity Secret and Creates Wallet Set
 */

const crypto = require('crypto');

const CIRCLE_API_KEY = 'TEST_API_KEY:4cdba3edb2297dbbe22bdaff3af95aa1:5addc703604be61e1cda3ccdcd023a46';
const ENTITY_SECRET = 'cbff116067281f4cee012b58369a11855914d44c0a6e02d5469593d463019287';

async function main() {
  console.log('🔧 Circle Wallet Setup\n');
  console.log('Entity Secret:', ENTITY_SECRET);
  console.log('');

  try {
    // Step 1: Get Circle's Public Key
    console.log('Step 1: Fetching Circle Public Key...');
    const publicKeyResponse = await fetch(
      'https://api.circle.com/v1/w3s/config/entity/publicKey',
      {
        headers: {
          'Authorization': `Bearer ${CIRCLE_API_KEY}`,
        },
      }
    );

    if (!publicKeyResponse.ok) {
      const error = await publicKeyResponse.text();
      throw new Error(`Failed to get public key: ${error}`);
    }

    const publicKeyData = await publicKeyResponse.json();
    const publicKey = publicKeyData.data.publicKey;
    console.log('✅ Got public key\n');

    // Step 2: Encrypt Entity Secret with Circle's Public Key
    console.log('Step 2: Encrypting Entity Secret...');
    
    // Convert hex entity secret to buffer
    const entitySecretBuffer = Buffer.from(ENTITY_SECRET, 'hex');
    
    // Encrypt with RSA-OAEP
    const encryptedEntitySecret = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      entitySecretBuffer
    );
    
    const entitySecretCiphertext = encryptedEntitySecret.toString('base64');
    console.log('✅ Entity Secret encrypted\n');

    // Step 3: Register Entity Secret with Circle
    console.log('Step 3: Registering Entity Secret...');
    const registerResponse = await fetch(
      'https://api.circle.com/v1/w3s/config/entity/entitySecret',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CIRCLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entitySecretCiphertext,
        }),
      }
    );

    if (!registerResponse.ok) {
      const error = await registerResponse.text();
      // Check if already registered
      if (error.includes('already') || registerResponse.status === 409) {
        console.log('ℹ️  Entity Secret already registered (this is OK)\n');
      } else {
        throw new Error(`Failed to register entity secret: ${error}`);
      }
    } else {
      console.log('✅ Entity Secret registered!\n');
    }

    // Step 4: Create a Wallet Set
    console.log('Step 4: Creating Wallet Set...');
    
    // Need fresh ciphertext for wallet set creation
    const freshCiphertext = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      entitySecretBuffer
    ).toString('base64');

    const idempotencyKey = crypto.randomUUID();
    const walletSetResponse = await fetch(
      'https://api.circle.com/v1/w3s/developer/walletSets',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CIRCLE_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Request-Id': idempotencyKey,
        },
        body: JSON.stringify({
          idempotencyKey,
          name: 'DeMemo Wallets',
          entitySecretCiphertext: freshCiphertext,
        }),
      }
    );

    if (!walletSetResponse.ok) {
      const error = await walletSetResponse.text();
      throw new Error(`Failed to create wallet set: ${error}`);
    }

    const walletSetData = await walletSetResponse.json();
    const walletSetId = walletSetData.data.walletSet.id;
    console.log('✅ Wallet Set created!\n');

    // Output results
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 SUCCESS! Add these to your .env.local file:');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`CIRCLE_ENTITY_SECRET=${ENTITY_SECRET}`);
    console.log(`CIRCLE_WALLET_SET_ID=${walletSetId}`);
    console.log('\n═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
