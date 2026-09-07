const PDFDocument = require("pdfkit");

module.exports = async function generateFacturePDF(commande) {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    doc.fontSize(20).text("Facture Paris Janitor", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Commande : ${commande._id}`);
    doc.text(`Montant TTC : ${commande.montantTTC} €`);
    doc.text(`Commission PJ : ${commande.commissionPJ} €`);
    doc.text(`Prestataire : ${commande.prestataireId}`);
    doc.text(`Client : ${commande.userId}`);

    doc.end();
  });
};
