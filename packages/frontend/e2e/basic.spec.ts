import { test, expect } from '@playwright/test';

test.describe('General UI and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Print browser console logs to host console
    page.on('console', msg => console.log(`BROWSER_LOG [${msg.type()}]: ${msg.text()}`));
    page.on('pageerror', err => console.error(`BROWSER_ERROR: ${err.message}`));

    // Mock Freighter wallet environment to avoid real extension dependency
    await page.addInitScript(() => {
      // Mock Freighter API's postMessage communication
      window.addEventListener("message", (event) => {
        if (event.data && event.data.source === "FREIGHTER_EXTERNAL_MSG_REQUEST") {
          const response = {
            source: "FREIGHTER_EXTERNAL_MSG_RESPONSE",
            messagedId: event.data.messageId,
          };
          if (event.data.type === "REQUEST_CONNECTION_STATUS") {
            (response as any).isConnected = true;
          } else if (event.data.type === "REQUEST_ALLOWED_STATUS") {
            (response as any).isAllowed = true;
          } else if (event.data.type === "REQUEST_PUBLIC_KEY" || event.data.type === "REQUEST_ACCESS") {
            (response as any).publicKey = "GABC1234567890WXYZ";
          } else if (event.data.type === "REQUEST_NETWORK") {
            (response as any).network = "TESTNET";
          } else if (event.data.type === "REQUEST_NETWORK_DETAILS") {
            (response as any).networkDetails = {
              network: "TESTNET",
              networkName: "Test Network",
              networkUrl: "https://horizon-testnet.stellar.org",
              networkPassphrase: "Test SDF Network ; September 2015",
            };
          } else if (event.data.type === "SET_ALLOWED_STATUS") {
            (response as any).isAllowed = true;
          }
          window.postMessage(response, window.location.origin);
        }
      });

      // Mock @stellar/freighter-api
      (window as any).freighter = {
        isConnected: () => Promise.resolve(true),
        isAllowed: () => Promise.resolve(true),
        getPublicKey: () => Promise.resolve('GABC1234567890WXYZ'),
        signTransaction: (xdr: string) => Promise.resolve(xdr),
        setAllowed: () => Promise.resolve(true),
      };
    });
  });

  test('homepage loads with Glassmorphism UI elements', async ({ page }) => {
    await page.goto('/');

    // Check for project title/logo
    await expect(page.getByText('very-prince', { exact: true })).toBeVisible();

    // Check for Glassmorphism-style hero section content
    await expect(page.getByText('Built on Stellar Soroban')).toBeVisible();

    // Check for wallet address display (mocked)
    // WalletButton.tsx uses truncateAddress which shows GABC...WXYZ
    await expect(page.getByText('GABC...WXYZ')).toBeVisible();
  });

  test('navigating to dashboard shows the main interface', async ({ page }) => {
    await page.goto('/');

    // Wait for the wallet to connect on the homepage first to prevent E2E race conditions
    await expect(page.getByText('GABC...WXYZ')).toBeVisible();

    // Click on Dashboard link
    await page.getByRole('link', { name: 'Dashboard', exact: true }).click();

    // Verify navigation to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Check for dashboard-specific elements
    await expect(page.getByText('PayoutRegistry', { exact: true })).toBeVisible();
    
    // Check for organization lookup input by placeholder
    await expect(page.getByPlaceholder(/e.g. stellar/i)).toBeVisible();
  });
});
