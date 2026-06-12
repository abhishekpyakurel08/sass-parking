const mongoose = require('mongoose');
const { Ticket } = require('./dist/models/ticket.model.js');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const tickets = await Ticket.find({ status: 'ACTIVE' }).limit(5);
  console.log("Active tickets:");
  tickets.forEach(t => console.log(`ID: ${t._id}, Number: ${t.ticket_number}, Tenant: ${t.tenant_id}`));

  const t1 = await Ticket.findOne({ ticket_number: "PKT-CR-5790" });
  console.log("Found 5790?:", t1 ? t1.ticket_number : 'no');

  const tenantId = tickets[0]?.tenant_id;
  const code = "PKT-CR-5790";
  const t2 = await Ticket.findOne({
        tenant_id: tenantId,
        $or: [
          { ticket_number: code },
          { ticket_number: code.toLowerCase() },
          { ticket_number: code.toUpperCase() },
          { license_plate: code.toUpperCase() },
          { license_plate: code },
          { license_plate: code.toLowerCase() }
        ]
      });
  console.log("Found with tenantId?", t2 ? 'yes' : 'no');
  
  mongoose.disconnect();
}
run();
