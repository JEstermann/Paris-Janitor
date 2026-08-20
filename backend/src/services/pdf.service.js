const PDFDocument = require("pdfkit");
const fs = require("fs");

module.exports = {
  generateFacture: async (commande, user) => {
    const doc = new PDFDocument();
    const path = `./factures/facture_${commande._id}.pdf`;

    doc.pipe(fs.createWriteStream(path));

    doc.fontSize(20).text("Facture Paris Janitor");
    doc.text(`Client : ${user.email}`);
    doc.text(`Prestation : ${commande.prestationId}`);
    doc.text(`Montant TTC : ${commande.montantTTC} €`);
    doc.text(`Commission PJ : ${commande.commissionPJ}%`);

    doc.end();

    return path;
  }
};
