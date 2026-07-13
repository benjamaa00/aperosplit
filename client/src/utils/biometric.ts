export async function checkBiometricAvailable(): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false;
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

export async function registerBiometric(memberId: string): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false;

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = new TextEncoder().encode(memberId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "Équilibra Groupe", id: window.location.hostname },
        user: {
          id: userId,
          name: `member-${memberId}`,
          displayName: `Membre ${memberId}`,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
      },
    });

    if (credential) {
      const credId = btoa(String.fromCharCode(...Array.from(new Uint8Array((credential as PublicKeyCredential).rawId))));
      localStorage.setItem(`equilibra_cred_${memberId}`, credId);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function authenticateBiometric(memberId: string): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false;

    const credIdStr = localStorage.getItem(`equilibra_cred_${memberId}`);
    if (!credIdStr) return false;

    const credId = Uint8Array.from(atob(credIdStr), (c) => c.charCodeAt(0));
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [{ id: credId, type: "public-key" }],
        userVerification: "required",
        timeout: 60000,
      },
    });

    return !!assertion;
  } catch {
    return false;
  }
}
