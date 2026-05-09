import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "..", "images", "fournitures-bureau");

const files = fs
  .readdirSync(dir)
  .filter((f) => !f.startsWith(".") && /\.(png|jpe?g|webp)$/i.test(f));

function toDisplayName(stem) {
  return stem
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) =>
      w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""
    )
    .filter(Boolean)
    .join(" ");
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function describe(displayName, lower) {
  if (/stylo|marqueur|surligneur|blanco|encre|mine|critérium|porte mine/i.test(lower))
    return `${displayName} — pour l'écriture et la correction au quotidien en milieu professionnel.`;
  if (/papier|ramette|bristol|enveloppe|sous chemise|couverture|padex/i.test(lower))
    return `${displayName} — support papier pour impression, classement et correspondance.`;
  if (/agrafeuse|perforateur|agraf|ote agrafe|destructeur|destruct|reliure|spiral|baguette|plastif/i.test(lower))
    return `${displayName} — équipement pour assembler, perforer ou protéger vos documents.`;
  if (/tableau|flipchart|post-it|étiquette|label|marque page|effaceur tableau/i.test(lower))
    return `${displayName} — affichage, annotation et organisation visuelle de l'espace de travail.`;
  if (/classeur|chemise|dossier|boite archive|registre/i.test(lower))
    return `${displayName} — classement et conservation des dossiers et archives.`;
  if (/batterie|duracell|calculatrice|ciseau|cutter|colle|scotch|dérouleur/i.test(lower))
    return `${displayName} — accessoire utile au quotidien pour équipes administratives.`;
  if (/corbeille|organisateur/i.test(lower))
    return `${displayName} — aménagement et rangement du poste de travail.`;
  if (/cachet|dateur|numéroteur|encrier|trodat/i.test(lower))
    return `${displayName} — marquage et traçabilité des documents et courriers.`;
  if (/attache|élastique|coin de lettre|clips/i.test(lower))
    return `${displayName} — petit matériel pour l'expédition et la fixation des pièces.`;
  if (/gomme|bloc note|bloc de|pack agenda|recharge|dymo/i.test(lower))
    return `${displayName} — consommable ou petit matériel pour le bureau au quotidien.`;
  return `${displayName} — fourniture de bureau pour administrations et entreprises ; stock sur demande.`;
}

const items = files.map((f) => {
  const stem = path.parse(f).name;
  const displayName = toDisplayName(stem);
  return { f, displayName };
});

items.sort((a, b) =>
  a.displayName.localeCompare(b.displayName, "fr", { sensitivity: "base" })
);

const blocks = items.map(({ f, displayName }) => {
  const imgSrc = escapeHtml("images/fournitures-bureau/" + f);
  const wa =
    "https://wa.me/221779816060?text=" +
    encodeURIComponent(
      "Bonjour, je suis intéressé par le produit : " + displayName
    );
  const desc = describe(displayName, displayName.toLowerCase());
  return `          <div
            data-cat="fournitures-bureau"
            class="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col"
          >
            <div
              class="w-full bg-gray-50 overflow-hidden"
              style="aspect-ratio: 4/3"
            >
              <img
                src="${imgSrc}"
                alt="${escapeHtml(displayName)}"
                class="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div class="p-5 flex flex-col flex-1">
              <h3 class="font-bold text-navy uppercase text-sm tracking-wide mb-1">
                ${escapeHtml(displayName)}
              </h3>
              <p class="text-xs text-gray-500 leading-relaxed flex-1">
                ${escapeHtml(desc)}
              </p>
              <a
                href="${wa}"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-4 bg-orange-brand text-white text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-lg text-center hover-orange transition"
                >Demander un devis</a
              >
            </div>
          </div>`;
});

process.stdout.write(
  `          <!-- FOURNITURES BUREAU (catalogue photo) -->\n${blocks.join(
    "\n\n"
  )}\n`
);
