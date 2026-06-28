async function testQuery(term) {
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=5`);
    const data = await res.json();
    console.log(`Query "${term}" -> Results count:`, data.resultCount);
  } catch (err) {
    console.error(`Query "${term}" failed:`, err.message);
  }
}

async function run() {
  await testQuery('Bollywood hits');
  await testQuery('Tamil film hits Anirudh A.R. Rahman');
  await testQuery('Malayalam movie hits Sushin Shyam');
  await testQuery('Arijit Singh Pritam hit songs');
  
  console.log("\nTesting simpler queries...");
  await testQuery('Anirudh Ravichander');
  await testQuery('Sushin Shyam');
  await testQuery('Arijit Singh');
}

run();
