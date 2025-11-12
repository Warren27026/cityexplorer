# CityExplorer – Compatibilité Node.js 22.15.0

_Mis à jour automatiquement le 2025-11-11._

## Changements principaux
- **React / react-dom**: passage en **^19.0.0** (stable) au lieu des versions RC.
- **Engines**: ajout de `"node": ">=22.15.0"` pour documenter la version requise.
- **packageManager**: défini sur `npm@10` (optionnel, modifiable si vous utilisez pnpm/yarn).

## Actions recommandées
1. Supprimer les modules et réinstaller :
   ```bash
   rm -rf node_modules package-lock.json
   npm i
   ```
2. Lancer le projet :
   ```bash
   npm run dev
   ```

## Notes Next.js/TypeScript
- Next 16 et TypeScript ^5 sont compatibles avec Node 22.
- Si vous utilisez des API Node natives (`fetch`, `crypto`, `URLPattern`), privilégiez les versions intégrées à Node 22.
