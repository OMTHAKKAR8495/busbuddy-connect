import mongoose from "mongoose";
import dotenv from "dotenv";

import Route from "./models/Route.js";
import Stop from "./models/Stop.js";
import Bus from "./models/Bus.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gsfcu_transit";

const routesData = [
  {
    routeNumber: "Route 1",
    name: "Soma Talav (BPC Pump) → GSFC University",
    description: "Bus GJ-16-AU-4788 via Soma Talav, Gurukul, Bapod Police St, Super Bekery.",
    polyline: [[22.2891, 73.2382], [22.2940, 73.2300], [22.2985, 73.2241], [22.3120, 73.2080], [22.3800, 73.1930]],
    departureTime: "07:30 AM",
    plate: "GJ-16-AU-4788",
    busNumber: "01",
    stops: [
      { name: "Soma Talav (BPC Pump)", lat: 22.2891, lng: 73.2382, stopOrder: 1, scheduledTime: "07:30 AM" },
      { name: "Gurukul Char Rasta", lat: 22.2940, lng: 73.2300, stopOrder: 2, scheduledTime: "07:40 AM" },
      { name: "Bapod Police St", lat: 22.2985, lng: 73.2241, stopOrder: 3, scheduledTime: "07:50 AM" },
      { name: "Super Bekery", lat: 22.3120, lng: 73.2080, stopOrder: 4, scheduledTime: "08:00 AM" },
      { name: "GSFC University Main Gate", lat: 22.3800, lng: 73.1930, stopOrder: 5, scheduledTime: "08:15 AM" },
    ],
  },
  {
    routeNumber: "Route 2",
    name: "Parivar Char Rasta → GSFC University",
    description: "Bus GJ-06-BX-3670 via Parivar, Vrundavan, Sardar Estate, Earth Icon, Amit Nagar.",
    polyline: [[22.3020, 73.2260], [22.3180, 73.2220], [22.3320, 73.2100], [22.3450, 73.2010], [22.3480, 73.1960], [22.3800, 73.1930]],
    departureTime: "07:35 AM",
    plate: "GJ-06-BX-3670",
    busNumber: "02",
    stops: [
      { name: "Parivar Char Rasta", lat: 22.3020, lng: 73.2260, stopOrder: 1, scheduledTime: "07:35 AM" },
      { name: "Vrundavan Circle", lat: 22.3180, lng: 73.2220, stopOrder: 2, scheduledTime: "07:45 AM" },
      { name: "Sardar Estate (ISS)", lat: 22.3320, lng: 73.2100, stopOrder: 3, scheduledTime: "07:55 AM" },
      { name: "Earth Icon", lat: 22.3450, lng: 73.2010, stopOrder: 4, scheduledTime: "08:00 AM" },
      { name: "Amit Nagar", lat: 22.3480, lng: 73.1960, stopOrder: 5, scheduledTime: "08:05 AM" },
      { name: "GSFC University Main Gate", lat: 22.3800, lng: 73.1930, stopOrder: 6, scheduledTime: "08:15 AM" },
    ],
  },
  {
    routeNumber: "Route 3",
    name: "Khodiyar Nagar (50 Seater) → GSFC University",
    description: "Bus GJ-06-BV-2875 via Khodiyar Nagar, Airport Circle, Harni Gada, Golden Chokadi, Dena.",
    polyline: [[22.3310, 73.2210], [22.3270, 73.2290], [22.3390, 73.2270], [22.3680, 73.2250], [22.3820, 73.2180], [22.3800, 73.1930]],
    departureTime: "07:25 AM",
    plate: "GJ-06-BV-2875",
    busNumber: "03",
    capacity: 50,
    stops: [
      { name: "Khodiyar Nagar", lat: 22.3310, lng: 73.2210, stopOrder: 1, scheduledTime: "07:25 AM" },
      { name: "Airport Circle", lat: 22.3270, lng: 73.2290, stopOrder: 2, scheduledTime: "07:35 AM" },
      { name: "Harni Gada Circle", lat: 22.3390, lng: 73.2270, stopOrder: 3, scheduledTime: "07:45 AM" },
      { name: "Golden Chokadi", lat: 22.3680, lng: 73.2250, stopOrder: 4, scheduledTime: "07:55 AM" },
      { name: "Dena Chokadi", lat: 22.3820, lng: 73.2180, stopOrder: 5, scheduledTime: "08:05 AM" },
      { name: "GSFC University Main Gate", lat: 22.3800, lng: 73.1930, stopOrder: 6, scheduledTime: "08:15 AM" },
    ],
  },
  {
    routeNumber: "Route 4",
    name: "Chankypuri → GSFC University",
    description: "Bus GJ-06-AX-3348 via Chankypuri, Abhilasha Char Rasta, Miletry Boys.",
    polyline: [[22.3410, 73.1610], [22.3490, 73.1680], [22.3620, 73.1750], [22.3800, 73.1930]],
    departureTime: "07:40 AM",
    plate: "GJ-06-AX-3348",
    busNumber: "04",
    stops: [
      { name: "Chankypuri", lat: 22.3410, lng: 73.1610, stopOrder: 1, scheduledTime: "07:40 AM" },
      { name: "Abhilasha Char Rasta", lat: 22.3490, lng: 73.1680, stopOrder: 2, scheduledTime: "07:50 AM" },
      { name: "Miletry Boys", lat: 22.3620, lng: 73.1750, stopOrder: 3, scheduledTime: "08:00 AM" },
      { name: "GSFC University Main Gate", lat: 22.3800, lng: 73.1930, stopOrder: 4, scheduledTime: "08:15 AM" },
    ],
  },
  {
    routeNumber: "Route 5",
    name: "Earth Icon → GSFC University",
    description: "Bus GJ-16-AU-4890 via Earth Icon, Jagdish Farshan, Amit Nagar, L & T Circle.",
    polyline: [[22.3450, 73.2010], [22.3470, 73.1980], [22.3480, 73.1960], [22.3580, 73.1890], [22.3800, 73.1930]],
    departureTime: "07:45 AM",
    plate: "GJ-16-AU-4890",
    busNumber: "05",
    stops: [
      { name: "Earth Icon", lat: 22.3450, lng: 73.2010, stopOrder: 1, scheduledTime: "07:45 AM" },
      { name: "Jagdish Farshan", lat: 22.3470, lng: 73.1980, stopOrder: 2, scheduledTime: "07:50 AM" },
      { name: "Amit Nagar", lat: 22.3480, lng: 73.1960, stopOrder: 3, scheduledTime: "07:55 AM" },
      { name: "L & T Circle", lat: 22.3580, lng: 73.1890, stopOrder: 4, scheduledTime: "08:05 AM" },
      { name: "GSFC University Main Gate", lat: 22.3800, lng: 73.1930, stopOrder: 5, scheduledTime: "08:15 AM" },
    ],
  },
  {
    routeNumber: "Route 6",
    name: "Voltamp Company → GSFC University",
    description: "Bus GJ-06-BV-7584 via Voltamp, Maneja Crossing, Hanuman Temple, Novino, Susen Circle.",
    polyline: [[22.2410, 73.1940], [22.2480, 73.1980], [22.2560, 73.1920], [22.2680, 73.1890], [22.2790, 73.1860], [22.3800, 73.1930]],
    departureTime: "07:15 AM",
    plate: "GJ-06-BV-7584",
    busNumber: "06",
    stops: [
      { name: "Voltamp Company", lat: 22.2410, lng: 73.1940, stopOrder: 1, scheduledTime: "07:15 AM" },
      { name: "Maneja Crossing", lat: 22.2480, lng: 73.1980, stopOrder: 2, scheduledTime: "07:25 AM" },
      { name: "Hanuman Temple (MAK)", lat: 22.2560, lng: 73.1920, stopOrder: 3, scheduledTime: "07:35 AM" },
      { name: "Novino", lat: 22.2680, lng: 73.1890, stopOrder: 4, scheduledTime: "07:45 AM" },
      { name: "Susen Circle", lat: 22.2790, lng: 73.1860, stopOrder: 5, scheduledTime: "07:55 AM" },
      { name: "GSFC University Main Gate", lat: 22.3800, lng: 73.1930, stopOrder: 6, scheduledTime: "08:15 AM" },
    ],
  },
  {
    routeNumber: "Route 7",
    name: "Ravi Park → GSFC University",
    description: "Bus GJ-16-AU-1390 via Ravi Park, Gamgasagar, Kabir Complex, Polo Ground.",
    polyline: [[22.2850, 73.1980], [22.2910, 73.1940], [22.2970, 73.1910], [22.3020, 73.1870], [22.3800, 73.1930]],
    departureTime: "07:30 AM",
    plate: "GJ-16-AU-1390",
    busNumber: "07",
    stops: [
      { name: "Ravi Park", lat: 22.2850, lng: 73.1980, stopOrder: 1, scheduledTime: "07:30 AM" },
      { name: "Gamgasagar", lat: 22.2910, lng: 73.1940, stopOrder: 2, scheduledTime: "07:40 AM" },
      { name: "Kabir Complex", lat: 22.2970, lng: 73.1910, stopOrder: 3, scheduledTime: "07:50 AM" },
      { name: "Polo Ground", lat: 22.3020, lng: 73.1870, stopOrder: 4, scheduledTime: "08:00 AM" },
      { name: "GSFC University Main Gate", lat: 22.3800, lng: 73.1930, stopOrder: 5, scheduledTime: "08:15 AM" },
    ],
  },
  {
    routeNumber: "Route 8",
    name: "Darbar Chowkdi → GSFC University",
    description: "Bus GJ-06-BV-7989 via Darbar Chowkdi, Pramukh Prasad, Avdhut Fatak, Kalaghoda, Mahesana Nagar.",
    polyline: [[22.2740, 73.1760], [22.2830, 73.1790], [22.2890, 73.1830], [22.3060, 73.1890], [22.3420, 73.1810], [22.3800, 73.1930]],
    departureTime: "07:20 AM",
    plate: "GJ-06-BV-7989",
    busNumber: "08",
    stops: [
      { name: "Darbar Chowkdi", lat: 22.2740, lng: 73.1760, stopOrder: 1, scheduledTime: "07:20 AM" },
      { name: "Pramukh Prasad / Pramukh Darshan", lat: 22.2830, lng: 73.1790, stopOrder: 2, scheduledTime: "07:30 AM" },
      { name: "Avdhut Fatak / Lal Baug Fatak", lat: 22.2890, lng: 73.1830, stopOrder: 3, scheduledTime: "07:40 AM" },
      { name: "Kalaghoda", lat: 22.3060, lng: 73.1890, stopOrder: 4, scheduledTime: "07:50 AM" },
      { name: "Mahesana Nagar Circle", lat: 22.3420, lng: 73.1810, stopOrder: 5, scheduledTime: "08:05 AM" },
      { name: "GSFC University Main Gate", lat: 22.3800, lng: 73.1930, stopOrder: 6, scheduledTime: "08:15 AM" },
    ],
  },
  {
    routeNumber: "Route 9",
    name: "Sarswati Complex → GSFC University",
    description: "Bus GJ-06-BV-2915 via Sarswati Complex, Tulsidham, Raj Mahel Gate, Fatehgung, Yogniketan, Nizampura.",
    polyline: [[22.2790, 73.1680], [22.2860, 73.1720], [22.2990, 73.1820], [22.3210, 73.1880], [22.3310, 73.1870], [22.3480, 73.1860], [22.3800, 73.1930]],
    departureTime: "07:25 AM",
    plate: "GJ-06-BV-2915",
    busNumber: "09",
    stops: [
      { name: "Sarswati Complex", lat: 22.2790, lng: 73.1680, stopOrder: 1, scheduledTime: "07:25 AM" },
      { name: "Tulsidham", lat: 22.2860, lng: 73.1720, stopOrder: 2, scheduledTime: "07:35 AM" },
      { name: "Raj Mahel Gate", lat: 22.2990, lng: 73.1820, stopOrder: 3, scheduledTime: "07:45 AM" },
      { name: "Fatehgung - BOB", lat: 22.3210, lng: 73.1880, stopOrder: 4, scheduledTime: "07:55 AM" },
      { name: "Yogniketan", lat: 22.3310, lng: 73.1870, stopOrder: 5, scheduledTime: "08:00 AM" },
      { name: "Nizampura - Tasty Vadapav", lat: 22.3480, lng: 73.1860, stopOrder: 6, scheduledTime: "08:05 AM" },
      { name: "GSFC University Main Gate", lat: 22.3800, lng: 73.1930, stopOrder: 7, scheduledTime: "08:15 AM" },
    ],
  },
  {
    routeNumber: "Route 10",
    name: "Khishcoli Circle → GSFC University",
    description: "Bus GJ-16-AU-3840 via Khishcoli Circle, Atladra, Kia Moter, Sun Pharma Road, Tandalja.",
    polyline: [[22.2690, 73.1510], [22.2760, 73.1540], [22.2840, 73.1580], [22.2910, 73.1610], [22.2980, 73.1640], [22.3800, 73.1930]],
    departureTime: "07:15 AM",
    plate: "GJ-16-AU-3840",
    busNumber: "10",
    stops: [
      { name: "Khishcoli Circle", lat: 22.2690, lng: 73.1510, stopOrder: 1, scheduledTime: "07:15 AM" },
      { name: "Atladra", lat: 22.2760, lng: 73.1540, stopOrder: 2, scheduledTime: "07:25 AM" },
      { name: "Kia Moter", lat: 22.2840, lng: 73.1580, stopOrder: 3, scheduledTime: "07:35 AM" },
      { name: "Sun Pharma Road", lat: 22.2910, lng: 73.1610, stopOrder: 4, scheduledTime: "07:45 AM" },
      { name: "Tandalja", lat: 22.2980, lng: 73.1640, stopOrder: 5, scheduledTime: "07:55 AM" },
      { name: "GSFC University Main Gate", lat: 22.3800, lng: 73.1930, stopOrder: 6, scheduledTime: "08:15 AM" },
    ],
  },
  {
    routeNumber: "Route 11",
    name: "Hari Nagar Char Rasta → GSFC University",
    description: "Bus GJ-06-AX-1826 via Hari Nagar, Nandalay, Zansi Ki Rani, Jain Derasar, Dashama Chokdi, ITI Gorwa, Panchwati.",
    polyline: [[22.3090, 73.1490], [22.3160, 73.1530], [22.3240, 73.1580], [22.3310, 73.1620], [22.3410, 73.1660], [22.3510, 73.1710], [22.3610, 73.1760], [22.3800, 73.1930]],
    departureTime: "07:20 AM",
    plate: "GJ-06-AX-1826",
    busNumber: "11",
    stops: [
      { name: "Hari Nagar Char Rasta", lat: 22.3090, lng: 73.1490, stopOrder: 1, scheduledTime: "07:20 AM" },
      { name: "Nandalay Circle", lat: 22.3160, lng: 73.1530, stopOrder: 2, scheduledTime: "07:28 AM" },
      { name: "Zansi Ki Rani", lat: 22.3240, lng: 73.1580, stopOrder: 3, scheduledTime: "07:36 AM" },
      { name: "Jain Derasar", lat: 22.3310, lng: 73.1620, stopOrder: 4, scheduledTime: "07:44 AM" },
      { name: "Dashama Chokdi", lat: 22.3410, lng: 73.1660, stopOrder: 5, scheduledTime: "07:52 AM" },
      { name: "ITI Gorwa", lat: 22.3510, lng: 73.1710, stopOrder: 6, scheduledTime: "08:00 AM" },
      { name: "Panchwati Circle", lat: 22.3610, lng: 73.1760, stopOrder: 7, scheduledTime: "08:08 AM" },
      { name: "GSFC University Main Gate", lat: 22.3800, lng: 73.1930, stopOrder: 8, scheduledTime: "08:15 AM" },
    ],
  },
  {
    routeNumber: "Route 12",
    name: "Akshar Chowk → GSFC University",
    description: "Bus GJ-06-BV-6129 via Akshar Chowk, Devdeep Nagar, Vasna Circle, Swaminarayan Mandir, Time Circle, Chhani Jakat Naka, Canal, Gurudwara.",
    polyline: [[22.2910, 73.1520], [22.2980, 73.1480], [22.3050, 73.1440], [22.3120, 73.1410], [22.3240, 73.1460], [22.3510, 73.1810], [22.3610, 73.1840], [22.3690, 73.1870], [22.3800, 73.1930]],
    departureTime: "07:10 AM",
    plate: "GJ-06-BV-6129",
    busNumber: "12",
    stops: [
      { name: "Akshar Chowk", lat: 22.2910, lng: 73.1520, stopOrder: 1, scheduledTime: "07:10 AM" },
      { name: "Devdeep Nagar", lat: 22.2980, lng: 73.1480, stopOrder: 2, scheduledTime: "07:18 AM" },
      { name: "Vasna Circle - Kheteshwar", lat: 22.3050, lng: 73.1440, stopOrder: 3, scheduledTime: "07:26 AM" },
      { name: "Swaminarayan Mandir", lat: 22.3120, lng: 73.1410, stopOrder: 4, scheduledTime: "07:34 AM" },
      { name: "Time Circle", lat: 22.3240, lng: 73.1460, stopOrder: 5, scheduledTime: "07:42 AM" },
      { name: "Chhani Jakat Naka", lat: 22.3510, lng: 73.1810, stopOrder: 6, scheduledTime: "07:55 AM" },
      { name: "Chhani Canal", lat: 22.3610, lng: 73.1840, stopOrder: 7, scheduledTime: "08:02 AM" },
      { name: "Chhani Gurudwara", lat: 22.3690, lng: 73.1870, stopOrder: 8, scheduledTime: "08:08 AM" },
      { name: "GSFC University Main Gate", lat: 22.3800, lng: 73.1930, stopOrder: 9, scheduledTime: "08:15 AM" },
    ],
  },
  {
    routeNumber: "Route 13",
    name: "Nilamber Circle → GSFC University",
    description: "Bus GJ-06-BV-6527 via Nilamber Circle, Yash Complex, Natubhai Circle, Chakli Circle, Trident Circle, Genda Circle.",
    polyline: [[22.3120, 73.1320], [22.3190, 73.1410], [22.3140, 73.1590], [22.3110, 73.1680], [22.3150, 73.1760], [22.3210, 73.1720], [22.3800, 73.1930]],
    departureTime: "07:25 AM",
    plate: "GJ-06-BV-6527",
    busNumber: "13",
    stops: [
      { name: "Nilamber Circle", lat: 22.3120, lng: 73.1320, stopOrder: 1, scheduledTime: "07:25 AM" },
      { name: "Yash Complex", lat: 22.3190, lng: 73.1410, stopOrder: 2, scheduledTime: "07:33 AM" },
      { name: "Natubhai Circle", lat: 22.3140, lng: 73.1590, stopOrder: 3, scheduledTime: "07:42 AM" },
      { name: "Chakli Circle", lat: 22.3110, lng: 73.1680, stopOrder: 4, scheduledTime: "07:50 AM" },
      { name: "Trident Circle", lat: 22.3150, lng: 73.1760, stopOrder: 5, scheduledTime: "07:57 AM" },
      { name: "Genda Circle", lat: 22.3210, lng: 73.1720, stopOrder: 6, scheduledTime: "08:05 AM" },
      { name: "GSFC University Main Gate", lat: 22.3800, lng: 73.1930, stopOrder: 7, scheduledTime: "08:15 AM" },
    ],
  },
];

async function seedMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`[MongoDB Seed] Connected to ${MONGODB_URI}`);

    // Clean existing data
    await Route.deleteMany({});
    await Stop.deleteMany({});
    await Bus.deleteMany({});

    for (const data of routesData) {
      const route = await Route.create({
        routeNumber: data.routeNumber,
        name: data.name,
        description: data.description,
        polyline: data.polyline,
        departureTime: data.departureTime,
        active: true,
      });

      console.log(`✓ Created Route: ${route.routeNumber} — ${route.name}`);

      for (const stopData of data.stops) {
        await Stop.create({
          routeId: route._id,
          name: stopData.name,
          lat: stopData.lat,
          lng: stopData.lng,
          stopOrder: stopData.stopOrder,
          scheduledTime: stopData.scheduledTime,
        });
      }

      await Bus.create({
        busNumber: data.busNumber,
        plate: data.plate,
        capacity: data.capacity || 40,
        routeId: route._id,
        active: true,
      });
    }

    console.log("🎉 [MongoDB Seed Complete] All 13 GSFC University routes, bus plates & stops seeded!");
    process.exit(0);
  } catch (err) {
    console.error("[MongoDB Seed Error]", err);
    process.exit(1);
  }
}

seedMongoDB();
