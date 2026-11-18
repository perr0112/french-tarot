import { expect, test, type Page } from '@playwright/test';

/** Plays the local seat simply: take a Garde sans if possible, never announce, first legal card. */
async function playMyTurn(page: Page): Promise<void> {
  const bid = page.getByRole('region', { name: 'Votre enchère' });
  if (await bid.isVisible()) {
    const gardeSans = bid.getByRole('button', { name: 'Garde sans' });
    await (
      (await gardeSans.isVisible()) ? gardeSans : bid.getByRole('button', { name: 'Passer' })
    ).click();
    return;
  }
  const chelem = page.getByRole('button', { name: 'Ne pas annoncer' });
  if (await chelem.isVisible()) return chelem.click();
  // Garde sans has no écart: lit cards in the hand mean it is our card to play.
  const playable = page
    .getByRole('list', { name: 'Votre main' })
    .getByRole('button', { disabled: false });
  if ((await playable.count()) > 0) await playable.last().click();
}

test('create a table, fill it with bots and play a deal to its score', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Votre pseudo').fill('Alice');
  await page.getByRole('button', { name: 'Créer une table' }).click();
  await expect(page).toHaveURL(/\/salle\/[A-Z0-9]{6}$/);

  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: 'Ajouter un bot' }).first().click();
  await page.getByRole('combobox', { name: 'Vitesse des bots' }).selectOption('fast');
  await page.getByRole('button', { name: 'Lancer la partie' }).click();
  await expect(page.getByRole('list', { name: 'Votre main' })).toBeVisible();

  const result = page.getByRole('region', { name: 'Fin de la donne' });
  const cancelled = page.getByRole('heading', { name: 'Donne annulée' });
  for (let step = 0; step < 400; step++) {
    if ((await result.isVisible()) || (await cancelled.isVisible())) break;
    await playMyTurn(page);
    await page.waitForTimeout(250);
  }
  await expect(result.or(cancelled)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuer' })).toBeVisible();
});
