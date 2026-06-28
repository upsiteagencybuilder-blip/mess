import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

const MESS_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80",
];

function pickPhoto(i: number) {
  return MESS_IMAGES[i % MESS_IMAGES.length];
}

async function main() {
  console.log("Seeding database...");

  // Clean
  await db.invoice.deleteMany();
  await db.utilityBill.deleteMany();
  await db.bookingRequest.deleteMany();
  await db.member.deleteMany();
  await db.seat.deleteMany();
  await db.room.deleteMany();
  await db.mess.deleteMany();
  await db.user.deleteMany();

  // Users
  const owner1 = await db.user.create({
    data: {
      email: "rahim@mess.com",
      password: hashPassword("123456"),
      name: "রহিম আহমেদ",
      phone: "01711000001",
      role: "OWNER",
    },
  });
  const owner2 = await db.user.create({
    data: {
      email: "karim@mess.com",
      password: hashPassword("123456"),
      name: "করিম উদ্দিন",
      phone: "01711000002",
      role: "OWNER",
    },
  });
  const owner3 = await db.user.create({
    data: {
      email: "salma@mess.com",
      password: hashPassword("123456"),
      name: "সালমা আক্তার",
      phone: "01711000003",
      role: "OWNER",
    },
  });

  const tenant1 = await db.user.create({
    data: {
      email: "tanvir@tenant.com",
      password: hashPassword("123456"),
      name: "তানভীর হাসান",
      phone: "01712000001",
      role: "TENANT",
    },
  });
  const tenant2 = await db.user.create({
    data: {
      email: "nila@tenant.com",
      password: hashPassword("123456"),
      name: "নীলা রহমান",
      phone: "01712000002",
      role: "TENANT",
    },
  });
  const tenant3 = await db.user.create({
    data: {
      email: "sabbir@tenant.com",
      password: hashPassword("123456"),
      name: "সাব্বির খান",
      phone: "01712000003",
      role: "TENANT",
    },
  });

  const staff1 = await db.user.create({
    data: {
      email: "staff@mess.com",
      password: hashPassword("123456"),
      name: "আব্দুল মালেক",
      phone: "01713000001",
      role: "STAFF",
    },
  });

  const owners = [
    { user: owner1, name: "আল-মদিনা ছাত্র মেস", type: "STUDENT_MALE", area: "Dhanmondi", city: "Dhaka", lat: 23.7461, lng: 90.3742, rent: 4500, phone: "01711000001", rooms: 6, perRoom: 3, photoIdx: 0, amenities: ["wifi","filteredWater","generator","security","cctv","kitchen","geyser","rooftop"], desc: "ধানমন্ডি ২৭ নং এ অবস্থিত ছাত্রদের জন্য সাশ্রয়ী মেস। সব সুযোগ-সুবিধা সহ পরিচ্ছন্ন পরিবেশ।" },
    { user: owner2, name: "বসুন্ধরা প্রফেশনাল হোস্টেল", type: "PROFESSIONAL", area: "Bashundhara", city: "Dhaka", lat: 23.8133, lng: 90.4254, rent: 7000, phone: "01711000002", rooms: 8, perRoom: 2, photoIdx: 1, amenities: ["wifi","filteredWater","lift","parking","cctv","washingMachine","geyser","kitchen","dining"], desc: "বসুন্ধরা আর/এ তে চাকরিজীবীদের জন্য আধুনিক হোস্টেল। নর্থ সাউথ বিশ্ববিদ্যালয় নিকটবর্তী।" },
    { user: owner3, name: "নীলক্ষেত ছাত্রী মেস", type: "STUDENT_FEMALE", area: "Mohakhali", city: "Dhaka", lat: 23.7788, lng: 90.4012, rent: 5000, phone: "01711000003", rooms: 5, perRoom: 3, photoIdx: 2, amenities: ["wifi","filteredWater","security","cctv","geyser","washingMachine","kitchen","dining","rooftop"], desc: "মহাখালীতে ছাত্রীদের জন্য নিরাপদ ও পরিচ্ছন্ন মেস। মহিলা ওয়ার্ডেন সহ।" },
    { user: owner1, name: "মিরপুর স্টুডেন্ট রেসিডেন্স", type: "STUDENT_MALE", area: "Mirpur", city: "Dhaka", lat: 23.8068, lng: 90.3686, rent: 4000, phone: "01711000011", rooms: 5, perRoom: 4, photoIdx: 3, amenities: ["wifi","filteredWater","generator","kitchen","geyser"], desc: "মিরপুর ১০ এ সাশ্রয়ী মেস। বাসস্টপ ও মার্কেট নিকটে।" },
    { user: owner2, name: "উত্তরা প্রিমিয়াম হোস্টেল", type: "PROFESSIONAL", area: "Uttara", city: "Dhaka", lat: 23.8728, lng: 90.3984, rent: 8000, phone: "01711000012", rooms: 7, perRoom: 2, photoIdx: 4, amenities: ["wifi","filteredWater","lift","parking","cctv","security","washingMachine","geyser","kitchen","dining"], desc: "উত্তরা সেক্টর ৭ এ প্রিমিয়াম হোস্টেল। এসি অপশন সহ।" },
    { user: owner3, name: "মোহাম্মদপুর মিক্সড মেস", type: "MIXED", area: "Mohammadpur", city: "Dhaka", lat: 23.7657, lng: 90.3612, rent: 5500, phone: "01711000013", rooms: 6, perRoom: 3, photoIdx: 0, amenities: ["wifi","filteredWater","generator","cctv","kitchen","geyser","parking"], desc: "মোহাম্মদপুরে ফ্লোর ভিত্তিক মিক্সড মেস।" },
    { user: owner1, name: "ফার্মগেট স্কলার্স মেস", type: "STUDENT_MALE", area: "Farmgate", city: "Dhaka", lat: 23.7549, lng: 90.3913, rent: 4800, phone: "01711000014", rooms: 4, perRoom: 3, photoIdx: 1, amenities: ["wifi","filteredWater","generator","security","kitchen","geyser","rooftop"], desc: "ফার্মগেটে ঢাকা কলেজ ও বিশ্ববিদ্যালয় শিক্ষার্থীদের জন্য।" },
    { user: owner2, name: "পান্থপথ সিটি হোস্টেল", type: "PROFESSIONAL", area: "Panthapath", city: "Dhaka", lat: 23.7509, lng: 90.3843, rent: 6500, phone: "01711000015", rooms: 6, perRoom: 2, photoIdx: 2, amenities: ["wifi","filteredWater","lift","parking","cctv","washingMachine","geyser","dining"], desc: "পান্থপথে বসুন্ধরা সিটির পাশে আধুনিক হোস্টেল।" },
  ];

  let messCounter = 0;
  for (const m of owners) {
    messCounter++;
    const totalSeats = m.rooms * m.perRoom;
    const code = `MESS-${String(messCounter).padStart(3, "0")}`;
    const mess = await db.mess.create({
      data: {
        code,
        name: m.name,
        description: m.desc,
        ownerId: m.user.id,
        type: m.type,
        address: `${m.area}, ${m.city}`,
        area: m.area,
        city: m.city,
        lat: m.lat,
        lng: m.lng,
        rentPerSeat: m.rent,
        contactNumber: m.phone,
        photos: JSON.stringify([pickPhoto(m.photoIdx), pickPhoto(m.photoIdx + 1)]),
        amenities: JSON.stringify(m.amenities),
        totalRooms: m.rooms,
        totalSeats,
        vacantSeats: totalSeats,
      },
    });

    // Create rooms + seats
    for (let r = 1; r <= m.rooms; r++) {
      const room = await db.room.create({
        data: {
          messId: mess.id,
          roomNumber: `${r * 100} (Room ${r})`,
          capacity: m.perRoom,
        },
      });
      for (let s = 1; s <= m.perRoom; s++) {
        await db.seat.create({
          data: {
            roomId: room.id,
            messId: mess.id,
            seatNumber: `R${r}-S${s}`,
            status: "VACANT",
          },
        });
      }
    }
  }

  // Assign some members to the first mess (owner1's Al-Madina)
  const firstMess = await db.mess.findFirst({ where: { ownerId: owner1.id } });
  if (firstMess) {
    const seats = await db.seat.findMany({ where: { messId: firstMess.id, status: "VACANT" }, take: 3 });
    const tenants = [tenant1, tenant2, tenant3];
    for (let i = 0; i < seats.length; i++) {
      const seat = seats[i];
      const t = tenants[i];
      await db.member.create({
        data: {
          messId: firstMess.id,
          userId: t.id,
          seatId: seat.id,
          joinDate: new Date(2026, 4, 1),
        },
      });
      await db.seat.update({ where: { id: seat.id }, data: { status: "OCCUPIED" } });
    }
    await db.mess.update({ where: { id: firstMess.id }, data: { vacantSeats: firstMess.totalSeats - 3 } });

    // Utility bill for previous month
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    await db.utilityBill.create({
      data: {
        messId: firstMess.id,
        month: prevMonth + 1,
        year: prevYear,
        electricity: 4500,
        gas: 1200,
        internet: 1500,
        garbage: 400,
        caretaker: 3000,
      },
    });
    await db.utilityBill.create({
      data: {
        messId: firstMess.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        electricity: 5200,
        gas: 1300,
        internet: 1500,
        garbage: 400,
        caretaker: 3000,
      },
    });

    // Generate invoices for the previous month (3 members, shared bill / 3)
    const members = await db.member.findMany({ where: { messId: firstMess.id, status: "ACTIVE" } });
    const util = await db.utilityBill.findFirst({ where: { messId: firstMess.id, month: prevMonth + 1, year: prevYear } });
    if (util) {
      const shared = Math.ceil((util.electricity + util.gas + util.internet + util.garbage + util.caretaker) / members.length);
      for (let mi = 0; mi < members.length; mi++) {
        const mem = members[mi];
        await db.invoice.create({
          data: {
            messId: firstMess.id,
            memberId: mem.id,
            userId: mem.userId,
            month: prevMonth + 1,
            year: prevYear,
            rent: firstMess.rentPerSeat,
            electricityShare: Math.ceil(util.electricity / members.length),
            gasShare: Math.ceil(util.gas / members.length),
            internetShare: Math.ceil(util.internet / members.length),
            garbageShare: Math.ceil(util.garbage / members.length),
            caretakerShare: Math.ceil(util.caretaker / members.length),
            total: firstMess.rentPerSeat + shared,
            status: mi === 0 ? "PAID" : "PENDING", // one paid as example
            paidAt: mi === 0 ? new Date(prevYear, prevMonth, 20) : null,
          },
        });
      }
    }
  }

  // Add a couple booking requests
  const targetMess = firstMess;
  if (targetMess) {
    await db.bookingRequest.create({
      data: {
        messId: targetMess.id,
        name: "জাকির হোসেন",
        phone: "01719000001",
        message: "আগামী মাসের ১ তারিখ থেকে সিট দরকার। অনুগ্রহ করে যোগাযোগ করুন।",
        status: "PENDING",
      },
    });
    await db.bookingRequest.create({
      data: {
        messId: targetMess.id,
        name: "মেহেদী হাসান",
        phone: "01719000002",
        message: "২ জনের জন্য সিট প্রয়োজন।",
        status: "PENDING",
      },
    });
  }

  console.log("Seed complete!");
  console.log("Owners: rahim@mess.com / karim@mess.com / salma@mess.com (pass: 123456)");
  console.log("Tenant: tanvir@tenant.com (pass: 123456)");
  console.log("Staff: staff@mess.com (pass: 123456)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
