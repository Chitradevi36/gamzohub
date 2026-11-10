// Central game registry. Each new title gets one entry here plus its own
// /games/<slug>/ folder (game.js, thumbnail, metadata.json) and /play/<slug>/ page.
window.GAMZOHUB_GAMES = [
  {
    slug: "max-rampage",
    title: "Max Rampage",
    category: "action",
    description:
      "Flip, spin and grab on skateboards, bikes and go-karts across 9 suburban stunt episodes, then beat Chad Stuntly.",
    thumbnail: "/games/max-rampage/thumbnail.svg",
    status: "live",
    tags: ["new"]
  },
  {
    slug: "alauddin",
    title: "Alauddin",
    category: "adventure",
    description:
      "Run the rooftops as Alauddin the thief, free Nazim the djinn and defeat the Serpent Vizier across 10 Arabian Nights levels.",
    thumbnail: "/games/alauddin/thumbnail.svg",
    status: "live", // live | soon
    tags: ["trending"]
  },
  {
    slug: "dino-dash-delivery",
    title: "Dino Dash Delivery",
    category: "action",
    description: "Ride a T-rex courier through a prehistoric city, dodging lava and meteors to deliver every parcel on time.",
    thumbnail: "/assets/img/teasers/dino-dash-delivery.svg",
    status: "soon",
    tags: []
  },
  {
    slug: "gravity-pizza",
    title: "Gravity Pizza",
    category: "puzzle",
    description: "Flip gravity to roll a pizza through a chaotic apartment block and reach the right door while it's still hot.",
    thumbnail: "/assets/img/teasers/gravity-pizza.svg",
    status: "soon",
    tags: []
  },
  {
    slug: "ghost-lift",
    title: "Ghost Lift",
    category: "logic",
    description: "Run a haunted hotel elevator and get every grumpy ghost to its floor before sunrise.",
    thumbnail: "/assets/img/teasers/ghost-lift.svg",
    status: "soon",
    tags: []
  },
  {
    slug: "sky-pirates",
    title: "Sky Pirates of Zephyra",
    category: "adventure",
    description: "Captain a patched-up airship, board enemy blimps and hunt for floating islands full of treasure.",
    thumbnail: "/assets/img/teasers/sky-pirates.svg",
    status: "soon",
    tags: []
  }
];

window.GAMZOHUB_CATEGORIES = [
  { slug: "action", label: "Action" },
  { slug: "adventure", label: "Adventure" },
  { slug: "puzzle", label: "Puzzle" },
  { slug: "logic", label: "Logic" }
];
