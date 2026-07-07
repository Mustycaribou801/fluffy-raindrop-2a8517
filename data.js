/* ============================================================
   THE MARGIN — DATA FILE
   ------------------------------------------------------------
   This is the only file you should need to touch week to week.
   Everything below is SAMPLE DATA so the site has something to
   render. Replace it with your own model output before you
   publish anything. Search "SAMPLE" to find every spot that
   needs a real number.

   RATING CODES (used everywhere below):
   "SD" Safe D    "LD" Likely D   "TD" Lean D
   "TU" Toss-up
   "TR" Lean R    "LR" Likely R   "SR" Safe R
   ============================================================ */

const SITE_META = {
  forecasterName: "Preston", // SAMPLE — put your name/byline here
  lastUpdated: "2026-07-06",  // update this every time you refresh data
  cycle: "2026 Midterms",
};

/* ------------------------------------------------------------
   2026 HOUSE RATINGS
   435 seats, 218 needed for control.
   Only listing seats you're actively rating individually (the
   competitive ones). Everything not listed is bucketed into
   "safeSeatsD" / "safeSeatsR" below as an aggregate so you're
   not hand-entering 380 uncontested seats.
------------------------------------------------------------ */
const HOUSE = {
  majority: 218,
  totalSeats: 435,
  // seats not individually tracked — lump sum by party
  safeSeatsD: 180, // SAMPLE
  safeSeatsR: 178, // SAMPLE
  races: [
    // SAMPLE ROWS — replace with your actual competitive board
    { district: "AZ-01", incumbent: "R", rating: "TU", note: "Open seat, redistricted 2025" },
    { district: "CA-13", incumbent: "D", rating: "LD", note: "" },
    { district: "CO-08", incumbent: "D", rating: "TD", note: "" },
    { district: "IA-01", incumbent: "R", rating: "TU", note: "" },
    { district: "ME-02", incumbent: "D", rating: "TR", note: "Trump won district in 2024" },
    { district: "MI-07", incumbent: "R", rating: "TU", note: "" },
    { district: "NC-01", incumbent: "D", rating: "LD", note: "New map" },
    { district: "NE-02", incumbent: "R", rating: "TD", note: "" },
    { district: "NJ-07", incumbent: "R", rating: "TR", note: "" },
    { district: "NY-04", incumbent: "D", rating: "LD", note: "" },
    { district: "NY-19", incumbent: "D", rating: "TD", note: "" },
    { district: "OH-09", incumbent: "D", rating: "TR", note: "Retirement" },
    { district: "PA-08", incumbent: "R", rating: "TU", note: "" },
    { district: "TX-28", incumbent: "D", rating: "LR", note: "" },
    { district: "VA-02", incumbent: "R", rating: "TU", note: "" },
    { district: "WI-03", incumbent: "R", rating: "TD", note: "" },
  ],
};

/* ------------------------------------------------------------
   2026 SENATE RATINGS
   35 seats up, 51 needed for control (assumes a specific VP
   tiebreak scenario — adjust threshold logic in script.js if
   you want to model a 50-50 chamber differently).
------------------------------------------------------------ */
const SENATE = {
  majority: 51,
  seatsUpForElection: 35,
  currentHoldoverD: 34, // Ds/independents not up this cycle
  currentHoldoverR: 31, // Rs not up this cycle
  races: [
    { state: "Alabama", abbr: "AL", incumbent: "R", incumbentName: "Tommy Tuberville", heldBy: "Republican", rating: "SR", note: "Republican-favored state", candidateStatus: "Incumbent running; Democratic field remains a long-shot contest.", polling: "No reliable general-election polling found in the public tracker.", previousResults: "2020 Senate: Tuberville 60.1%, Jones 39.7%. 2024 President: Trump carried Alabama by a wide margin.", demographicTrends: "Heavily Republican electorate with Democratic strength concentrated around Birmingham, Montgomery, and Black Belt counties.", analysis: "Alabama begins as a Safe Republican race unless the national environment becomes extraordinary or the Republican nominee changes.", ratingHistory: [{ date: "2026-07-06", rating: "SR", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections", "270toWin 2026 Senate polling"] },
    { state: "Alaska", abbr: "AK", incumbent: "R", incumbentName: "Dan Sullivan", heldBy: "Republican", rating: "TR", note: "Democrat nominee Mary Petola has previously won the AK-AL seat in a more republican leaning midterm indicating she has a strong change.", candidateStatus: "Incumbent Dan Sullivan is running; former Rep. Mary Peltola has entered the Senate race.", polling: "No consistent public general-election polling available yet.", previousResults: "2020 Senate: Sullivan 53.9%, Gross 41.2%. 2024 President: Trump carried Alaska.", demographicTrends: "Republicans retain a baseline edge, but ranked-choice voting and Peltola's rural/Native support keep the ceiling for Democrats higher than in many red states.", analysis: "Sullivan is favored, but Alaska is not treated as a routine safe hold because the Democratic nominee Democrat nominee Mary Petola has previously won the AK-AL seat in a more republican leaning midterm indicating she has a strong change.", ratingHistory: [{ date: "2026-07-06", rating: "LR", note: "Moved onto expanded watch list" }], lastUpdated: "2026-07-06", sources: ["Ballotpedia 2026 Senate elections", "270toWin Cook Political Report ratings", "270toWin 2026 Senate polling"] },
    { state: "Arkansas", abbr: "AR", incumbent: "R", incumbentName: "Tom Cotton", heldBy: "Republican", rating: "SR", note: "Deep red baseline", candidateStatus: "Incumbent running; Democratic path is currently minimal.", polling: "No public polling indicates a competitive general election.", previousResults: "2020 Senate: Cotton won without major-party Democratic opposition. 2024 President: Trump carried Arkansas by a wide margin.", demographicTrends: "Republican margins remain dominant outside a few urban and Delta counties.", analysis: "Arkansas is Safe Republican on fundamentals and candidate quality.", ratingHistory: [{ date: "2026-07-06", rating: "SR", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "Colorado", abbr: "CO", incumbent: "D", incumbentName: "John Hickenlooper", heldBy: "Democratic", rating: "SD", note: "Blue-state incumbent", candidateStatus: "Incumbent running; Republican field has not changed the race's baseline.", polling: "No public polling shows serious danger for the incumbent.", previousResults: "2020 Senate: Hickenlooper 53.5%, Gardner 44.2%. 2024 President: Harris carried Colorado.", demographicTrends: "Denver suburbs and college-educated Front Range voters continue to push the state left of the nation.", analysis: "Colorado remains Safe Democratic unless the national environment sharply turns against Democrats.", ratingHistory: [{ date: "2026-07-06", rating: "SD", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "Delaware", abbr: "DE", incumbent: "D", incumbentName: "Chris Coons", heldBy: "Democratic", rating: "SD", note: "Strong Democratic state", candidateStatus: "Incumbent running; no major upset signal.", polling: "No competitive general-election polling found.", previousResults: "2020 Senate: Coons 59.4%, Witzke 37.9%. 2024 President: Harris carried Delaware.", demographicTrends: "Democratic strength in New Castle County anchors the statewide vote.", analysis: "Delaware is a Safe Democratic hold.", ratingHistory: [{ date: "2026-07-06", rating: "SD", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "Florida", abbr: "FL", incumbent: "R", incumbentName: "Ashley Moody", heldBy: "Republican", rating: "LR", note: "Special election", candidateStatus: "Special election for the seat previously held by Marco Rubio; appointed incumbent Ashley Moody is running.", polling: "Sparse public polling; race rating is driven mostly by partisan trend and incumbency.", previousResults: "2024 President: Trump carried Florida comfortably. 2022 Senate: Rubio won by a large margin.", demographicTrends: "Florida has shifted right, especially in Miami-Dade and among older and Latino voters.", analysis: "The special election is worth tracking, but Florida's recent Republican trend keeps the GOP favored.", ratingHistory: [{ date: "2026-07-06", rating: "LR", note: "Initial special-election rating" }], lastUpdated: "2026-07-06", sources: ["270toWin Cook Political Report ratings", "Ballotpedia 2026 Senate elections", "270toWin 2026 Senate polling"] },
    { state: "Georgia", abbr: "GA", incumbent: "D", incumbentName: "Jon Ossoff", heldBy: "Democratic", rating: "TU", note: "Top-tier battleground", candidateStatus: "Incumbent Jon Ossoff is running; Republicans are contesting the nomination.", polling: "Public polling is limited and should be treated as directional rather than settled.", previousResults: "2022 Senate runoff: Warnock 51.4%, Walker 48.6%. 2024 President: Trump narrowly carried Georgia.", demographicTrends: "Atlanta-area growth and Black turnout keep Democrats competitive, while rural Republican margins remain very large.", analysis: "Georgia is one of the cycle's central control races. Ossoff has incumbency, but the presidential baseline and Senate map make this a Toss-up.", ratingHistory: [{ date: "2026-07-06", rating: "TU", note: "Initial toss-up rating" }], lastUpdated: "2026-07-06", sources: ["270toWin Cook Political Report ratings", "Ballotpedia 2026 Senate battlegrounds", "270toWin 2026 Senate polling"] },
    { state: "Idaho", abbr: "ID", incumbent: "R", incumbentName: "Jim Risch", heldBy: "Republican", rating: "SR", note: "Safe Republican", candidateStatus: "Republican-held seat; general election is not currently competitive.", polling: "No competitive public polling found.", previousResults: "2020 Senate: Risch 62.6%, Jordan 33.2%. 2024 President: Trump carried Idaho by a wide margin.", demographicTrends: "Rapid growth has not meaningfully changed the statewide Republican floor.", analysis: "Idaho is Safe Republican.", ratingHistory: [{ date: "2026-07-06", rating: "SR", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "Illinois", abbr: "IL", incumbent: "D", incumbentName: "Dick Durbin", heldBy: "Democratic", rating: "SD", note: "Open Democratic seat", candidateStatus: "Open Democratic-held seat after Dick Durbin's retirement; Democratic primary is the main contest.", polling: "General-election polling is limited; the state baseline strongly favors Democrats.", previousResults: "2020 Senate: Durbin 54.9%, Curran 38.9%. 2024 President: Harris carried Illinois.", demographicTrends: "Chicago and the collar counties provide a durable Democratic advantage.", analysis: "Even as an open seat, Illinois remains Safe Democratic barring a highly unusual collapse.", ratingHistory: [{ date: "2026-07-06", rating: "SD", note: "Open seat still rated Safe D" }], lastUpdated: "2026-07-06", sources: ["Ballotpedia 2026 Senate elections", "U.S. Senate Class II roster"] },
    { state: "Iowa", abbr: "IA", incumbent: "R", incumbentName: "Joni Ernst", heldBy: "Republican", rating: "LR", note: "Watch if wave builds", candidateStatus: "Republican-held seat; Democrats are recruiting in a state that has trended right.", polling: "No stable public polling average yet.", previousResults: "2020 Senate: Ernst 51.8%, Greenfield 45.2%. 2024 President: Trump carried Iowa.", demographicTrends: "Noncollege white voters have moved Iowa right, while Democrats still retain pockets of strength in metro and college counties.", analysis: "Iowa is not a Toss-up at the start, but it belongs on the board because a strong Democratic midterm could narrow it.", ratingHistory: [{ date: "2026-07-06", rating: "LR", note: "Initial watch-list rating" }], lastUpdated: "2026-07-06", sources: ["Ballotpedia 2026 Senate battlegrounds", "270toWin Cook Political Report ratings"] },
    { state: "Kansas", abbr: "KS", incumbent: "R", incumbentName: "Roger Marshall", heldBy: "Republican", rating: "SR", note: "Republican baseline", candidateStatus: "Incumbent running; Democratic contest is not currently rated competitive.", polling: "No competitive general-election polling found.", previousResults: "2020 Senate: Marshall 53.2%, Bollier 41.8%. 2024 President: Trump carried Kansas.", demographicTrends: "Kansas City suburbs have moderated, but not enough to overcome the statewide Republican advantage.", analysis: "Kansas stays Safe Republican.", ratingHistory: [{ date: "2026-07-06", rating: "SR", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "Kentucky", abbr: "KY", incumbent: "R", incumbentName: "Mitch McConnell", heldBy: "Republican", rating: "SR", note: "Open Republican seat", candidateStatus: "Open Republican-held seat after Mitch McConnell's retirement; Republican primary is the dominant contest.", polling: "No public polling indicates a competitive general election.", previousResults: "2020 Senate: McConnell 57.8%, McGrath 38.2%. 2024 President: Trump carried Kentucky by a wide margin.", demographicTrends: "Democrats retain some ancestral strength, but the federal baseline is deeply Republican.", analysis: "An open seat creates primary uncertainty, not a clear general-election opening.", ratingHistory: [{ date: "2026-07-06", rating: "SR", note: "Open seat rated Safe R" }], lastUpdated: "2026-07-06", sources: ["Ballotpedia 2026 Senate elections", "U.S. Senate Class II roster"] },
    { state: "Louisiana", abbr: "LA", incumbent: "R", incumbentName: "Bill Cassidy", heldBy: "Republican", rating: "SR", note: "Safe Republican", candidateStatus: "Republican-held seat; primary dynamics matter more than the general election.", polling: "No competitive general-election polling found.", previousResults: "2020 Senate: Cassidy won reelection outright. 2024 President: Trump carried Louisiana by a wide margin.", demographicTrends: "Republican strength outside New Orleans and Baton Rouge defines statewide races.", analysis: "Louisiana is Safe Republican.", ratingHistory: [{ date: "2026-07-06", rating: "SR", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "Maine", abbr: "ME", incumbent: "R", incumbentName: "Susan Collins", heldBy: "Republican", rating: "TR", note: "Blue-state GOP incumbent", candidateStatus: "Incumbent Susan Collins is running; Democrats view the seat as a top pickup opportunity.", polling: "Early polling is limited; race rating leans on state partisanship, incumbency, and candidate image.", previousResults: "2020 Senate: Collins 51.0%, Gideon 42.4%. 2024 President: Harris carried Maine statewide.", demographicTrends: "Southern Maine is strongly Democratic, while the 2nd District remains more Republican and culturally distinct.", analysis: "Collins has repeatedly outrun the state baseline, but Maine's federal lean and Senate control stakes keep the race highly competitive.", ratingHistory: [{ date: "2026-07-06", rating: "TR", note: "Initial Lean R rating" }], lastUpdated: "2026-07-06", sources: ["270toWin Cook Political Report ratings", "Ballotpedia 2026 Senate battlegrounds", "270toWin 2026 Senate polling"] },
    { state: "Massachusetts", abbr: "MA", incumbent: "D", incumbentName: "Ed Markey", heldBy: "Democratic", rating: "SD", note: "Safe Democratic", candidateStatus: "Democratic-held seat; general election is not currently competitive.", polling: "No competitive public polling found.", previousResults: "2020 Senate: Markey 66.2%, O'Connor 33.8%. 2024 President: Harris carried Massachusetts by a wide margin.", demographicTrends: "One of the most Democratic electorates in federal races.", analysis: "Massachusetts is Safe Democratic.", ratingHistory: [{ date: "2026-07-06", rating: "SD", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "Michigan", abbr: "MI", incumbent: "OPEN-D", incumbentName: "Gary Peters", heldBy: "Democratic open seat", rating: "TD", note: "Open battleground", candidateStatus: "Open Democratic-held seat after Gary Peters' retirement; both parties have active nomination fights.", polling: "Early public polling is sparse and sensitive to nominee assumptions.", previousResults: "2020 Senate: Peters 49.9%, James 48.2%. 2024 Senate: Slotkin won by less than one point.", demographicTrends: "Detroit-area Democratic strength, Grand Rapids suburban movement, and working-class shifts in Macomb/downstate counties keep the state close.", analysis: "Michigan is a Democratic-leaning battleground, but the open-seat status and narrow recent results prevent a stronger rating.", ratingHistory: [{ date: "2026-07-06", rating: "TD", note: "Initial Lean D rating" }], lastUpdated: "2026-07-06", sources: ["270toWin Cook Political Report ratings", "Ballotpedia 2026 Senate battlegrounds"] },
    { state: "Minnesota", abbr: "MN", incumbent: "D", incumbentName: "Tina Smith", heldBy: "Democratic", rating: "LD", note: "Open Democratic seat", candidateStatus: "Open Democratic-held seat after Tina Smith's retirement; Democrats retain the stronger baseline.", polling: "No settled public general-election polling average yet.", previousResults: "2020 Senate: Smith 48.7%, Lewis 43.5%. 2024 President: Harris carried Minnesota.", demographicTrends: "Twin Cities suburbs and high Democratic turnout offset Republican strength in rural areas.", analysis: "Open-seat risk keeps Minnesota on the board, but the state is still Likely Democratic.", ratingHistory: [{ date: "2026-07-06", rating: "LD", note: "Open seat rated Likely D" }], lastUpdated: "2026-07-06", sources: ["Ballotpedia 2026 Senate elections", "270toWin Cook Political Report ratings"] },
    { state: "Mississippi", abbr: "MS", incumbent: "R", incumbentName: "Cindy Hyde-Smith", heldBy: "Republican", rating: "SR", note: "Safe Republican", candidateStatus: "Incumbent running; Democratic path depends on a rare coalition break.", polling: "No public polling indicates a competitive general election.", previousResults: "2020 Senate: Hyde-Smith 54.1%, Espy 44.1%. 2024 President: Trump carried Mississippi.", demographicTrends: "Large Black electorate gives Democrats a floor, but white Republican margins keep the GOP advantage large.", analysis: "Mississippi is Safe Republican.", ratingHistory: [{ date: "2026-07-06", rating: "SR", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "Montana", abbr: "MT", incumbent: "R", incumbentName: "Steve Daines", heldBy: "Republican", rating: "SR", note: "Red-state incumbent", candidateStatus: "Incumbent running; Democrats lack the incumbency advantage they had in 2024.", polling: "No competitive general-election polling found.", previousResults: "2020 Senate: Daines 55.0%, Bullock 45.0%. 2024 President: Trump carried Montana by a wide margin.", demographicTrends: "Growth around Bozeman and Missoula is not enough to offset broad Republican strength.", analysis: "Without a Democratic incumbent, Montana rates Safe Republican.", ratingHistory: [{ date: "2026-07-06", rating: "SR", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "Nebraska", abbr: "NE", incumbent: "R", incumbentName: "Pete Ricketts", heldBy: "Republican", rating: "SR", note: "Republican special/regular cycle", candidateStatus: "Republican-held seat; independent or Democratic path remains speculative.", polling: "No current public polling shows a competitive general election.", previousResults: "2024 Senate special: Ricketts won. 2024 President: Trump carried Nebraska statewide.", demographicTrends: "Omaha is more competitive, but statewide elections remain strongly Republican.", analysis: "Nebraska is Safe Republican statewide.", ratingHistory: [{ date: "2026-07-06", rating: "SR", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "New Hampshire", abbr: "NH", incumbent: "OPEN-D", incumbentName: "Jeanne Shaheen", heldBy: "Democratic open seat", rating: "LD", note: "Open but blue-leaning", candidateStatus: "Open Democratic-held seat after Jeanne Shaheen's retirement; both parties are active.", polling: "Limited early public polling; nominee quality may matter more than current head-to-heads.", previousResults: "2020 Senate: Shaheen 56.6%, Messner 40.9%. 2024 President: Harris carried New Hampshire.", demographicTrends: "College-educated and suburban movement has helped Democrats, though the state remains elastic.", analysis: "New Hampshire is competitive enough to track but starts Likely Democratic because the recent federal baseline favors Democrats.", ratingHistory: [{ date: "2026-07-06", rating: "LD", note: "Initial Likely D rating" }], lastUpdated: "2026-07-06", sources: ["270toWin Cook Political Report ratings", "Ballotpedia 2026 Senate battlegrounds"] },
    { state: "New Jersey", abbr: "NJ", incumbent: "D", incumbentName: "Cory Booker", heldBy: "Democratic", rating: "SD", note: "Democratic incumbent", candidateStatus: "Incumbent running; race is not currently a top-tier battleground.", polling: "No public polling shows sustained danger for the incumbent.", previousResults: "2020 Senate: Booker 57.2%, Mehta 40.9%. 2024 President: Harris carried New Jersey.", demographicTrends: "The state can tighten in lower-turnout contests, but Democrats retain a clear federal advantage.", analysis: "New Jersey remains Safe Democratic unless the race materially changes.", ratingHistory: [{ date: "2026-07-06", rating: "SD", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "New Mexico", abbr: "NM", incumbent: "D", incumbentName: "Ben Ray Lujan", heldBy: "Democratic", rating: "LD", note: "Democratic-favored", candidateStatus: "Incumbent running; Republicans would need a strong national environment.", polling: "No consistent public general-election polling average yet.", previousResults: "2020 Senate: Lujan 51.7%, Ronchetti 45.6%. 2024 President: Harris carried New Mexico.", demographicTrends: "Democratic strength in Albuquerque, Santa Fe, and Hispanic communities keeps the state left of center.", analysis: "New Mexico is not off the board, but the incumbent begins with a clear advantage.", ratingHistory: [{ date: "2026-07-06", rating: "LD", note: "Initial Likely D rating" }], lastUpdated: "2026-07-06", sources: ["270toWin Cook Political Report ratings", "Ballotpedia 2026 Senate elections"] },
    { state: "North Carolina", abbr: "NC", incumbent: "OPEN-R", incumbentName: "Thom Tillis", heldBy: "Republican open seat", rating: "TD", note: "Democrats are favourites to GAIN the seat", candidateStatus: "Open Republican-held seat after Thom Tillis' retirement; former Gov. Roy Cooper is running for Democrats and Michael Whatley is running for Republicans.", polling: "Early public polling is demonstrating that Former Governor Cooper has a lead, but both parties treat the race as a top pickup/defense target.", previousResults: "2020 Senate: Tillis 48.7%, Cunningham 46.9%. 2024 President: Trump narrowly carried North Carolina.", demographicTrends: "Research Triangle and Charlotte growth helps Democrats, while rural and exurban Republican margins remain strong.", analysis: "North Carolina is leaning Democrat because former Governor Cooper is seriously popular in the state and the seat is open.", ratingHistory: [{ date: "2026-07-06", rating: "TU", note: "Initial toss-up rating" }], lastUpdated: "2026-07-06", sources: ["270toWin Cook Political Report ratings", "Ballotpedia 2026 Senate battlegrounds", "Ballotpedia 2026 Senate elections"] },
    { state: "Ohio", abbr: "OH", incumbent: "R", incumbentName: "Jon Husted", heldBy: "Republican", rating: "LR", note: "Special election", candidateStatus: "Special election for the seat vacated by JD Vance; appointed incumbent Jon Husted is running.", polling: "Sparse public polling; rating reflects Ohio's rightward trend and special-election uncertainty.", previousResults: "2024 Senate: Moreno defeated Brown. 2024 President: Trump carried Ohio comfortably.", demographicTrends: "Working-class realignment has moved Ohio right, though Democrats retain strength around Cleveland, Columbus, and Cincinnati.", analysis: "Ohio is a plausible Democratic target in a wave, but Republicans are favored at the start.", ratingHistory: [{ date: "2026-07-06", rating: "LR", note: "Initial special-election rating" }], lastUpdated: "2026-07-06", sources: ["270toWin Cook Political Report ratings", "Ballotpedia 2026 Senate battlegrounds"] },
    { state: "Oklahoma", abbr: "OK", incumbent: "R", incumbentName: "Markwayne Mullin", heldBy: "Republican", rating: "SR", note: "Safe Republican", candidateStatus: "Republican-held seat; general election is not currently competitive.", polling: "No competitive public polling found.", previousResults: "2022 Senate special: Mullin won by a wide margin. 2024 President: Trump carried every county in Oklahoma.", demographicTrends: "The state's federal baseline remains among the most Republican in the country.", analysis: "Oklahoma is Safe Republican.", ratingHistory: [{ date: "2026-07-06", rating: "SR", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "Oregon", abbr: "OR", incumbent: "D", incumbentName: "Jeff Merkley", heldBy: "Democratic", rating: "SD", note: "Safe Democratic", candidateStatus: "Incumbent running; Republican field has not changed the race's baseline.", polling: "No public polling shows serious danger for the incumbent.", previousResults: "2020 Senate: Merkley 56.9%, Perkins 39.3%. 2024 President: Harris carried Oregon.", demographicTrends: "Portland-area Democratic margins dominate statewide federal contests.", analysis: "Oregon is Safe Democratic.", ratingHistory: [{ date: "2026-07-06", rating: "SD", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "Rhode Island", abbr: "RI", incumbent: "D", incumbentName: "Jack Reed", heldBy: "Democratic", rating: "SD", note: "Safe Democratic", candidateStatus: "Incumbent running; race is not currently competitive.", polling: "No competitive public polling found.", previousResults: "2020 Senate: Reed 66.5%, Waters 33.5%. 2024 President: Harris carried Rhode Island.", demographicTrends: "Democrats hold a durable statewide advantage in federal elections.", analysis: "Rhode Island is Safe Democratic.", ratingHistory: [{ date: "2026-07-06", rating: "SD", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "South Carolina", abbr: "SC", incumbent: "R", incumbentName: "Lindsey Graham", heldBy: "Republican", rating: "SR", note: "Republican incumbent", candidateStatus: "Incumbent running; primary and ideological challenges are more relevant than the general election.", polling: "No public polling indicates a competitive general election.", previousResults: "2020 Senate: Graham 54.4%, Harrison 44.2%. 2024 President: Trump carried South Carolina.", demographicTrends: "Charleston and Columbia are more competitive, but the statewide Republican advantage is stable.", analysis: "South Carolina is Safe Republican.", ratingHistory: [{ date: "2026-07-06", rating: "SR", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "South Dakota", abbr: "SD", incumbent: "R", incumbentName: "Mike Rounds", heldBy: "Republican", rating: "SR", note: "Safe Republican", candidateStatus: "Incumbent running; Democratic path is minimal.", polling: "No competitive public polling found.", previousResults: "2020 Senate: Rounds 65.7%, Ahlers 34.3%. 2024 President: Trump carried South Dakota by a wide margin.", demographicTrends: "Statewide federal elections remain overwhelmingly Republican.", analysis: "South Dakota is Safe Republican.", ratingHistory: [{ date: "2026-07-06", rating: "SR", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "Tennessee", abbr: "TN", incumbent: "R", incumbentName: "Bill Hagerty", heldBy: "Republican", rating: "SR", note: "Safe Republican", candidateStatus: "Incumbent running; Democrats are not positioned for a competitive statewide race.", polling: "No competitive public polling found.", previousResults: "2020 Senate: Hagerty 62.2%, Bradshaw 35.2%. 2024 President: Trump carried Tennessee by a wide margin.", demographicTrends: "Nashville growth is not enough to offset statewide Republican margins.", analysis: "Tennessee is Safe Republican.", ratingHistory: [{ date: "2026-07-06", rating: "SR", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "Texas", abbr: "TX", incumbent: "R", incumbentName: "John Cornyn", heldBy: "Republican", rating: "TR", note: "GOP-favored but Ken Paxton the republican nominee is subject to controversy.", candidateStatus: "Republican-held seat with a contested GOP environment; Democrat nominee James Talarico will need to make significant inroads, especially because President Trump and Governor Greg Abbot are both popular in the state and will national tailwind.", polling: "Public polling is developing; but suggesting a tight race.", previousResults: "2020 Senate: Cornyn 53.5%, Hegar 43.9%. 2024 President: Trump carried Texas.", demographicTrends: "Metro growth and suburban change help Democrats, while border and rural trends have complicated their coalition.", analysis: "Texas is Republican-leaning, and trended to the right in 2024 especially as a result of the border crisis, however the Democratic focus on the state and grueling GOP primary dynamics make it worth a dedicated page.", ratingHistory: [{ date: "2026-07-06", rating: "LR", note: "Initial Likely R rating" }], lastUpdated: "2026-07-06", sources: ["Cook Political Report race summary", "270toWin Cook Political Report ratings", "270toWin 2026 Senate polling"] },
    { state: "Virginia", abbr: "VA", incumbent: "D", incumbentName: "Mark Warner", heldBy: "Democratic", rating: "LD", note: "Democratic-favored", candidateStatus: "Incumbent running; Republicans need a favorable national climate to make it close.", polling: "No consistent public polling average yet.", previousResults: "2020 Senate: Warner 56.0%, Gade 44.0%. 2024 President: Harris carried Virginia.", demographicTrends: "Northern Virginia and Richmond suburbs keep the state Democratic-leaning in federal races.", analysis: "Virginia is Likely Democratic: competitive in theory, but not yet a top-tier pickup target.", ratingHistory: [{ date: "2026-07-06", rating: "LD", note: "Initial Likely D rating" }], lastUpdated: "2026-07-06", sources: ["270toWin Cook Political Report ratings", "Ballotpedia 2026 Senate elections"] },
    { state: "West Virginia", abbr: "WV", incumbent: "R", incumbentName: "Shelley Moore Capito", heldBy: "Republican", rating: "SR", note: "Safe Republican", candidateStatus: "Incumbent running; federal Democratic brand is extremely weak statewide.", polling: "No competitive public polling found.", previousResults: "2020 Senate: Capito 70.3%, Swearengin 27.0%. 2024 President: Trump carried West Virginia by a very large margin.", demographicTrends: "The state has completed a major shift from Democratic ancestry to Republican dominance in federal races.", analysis: "West Virginia is Safe Republican.", ratingHistory: [{ date: "2026-07-06", rating: "SR", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
    { state: "Wyoming", abbr: "WY", incumbent: "R", incumbentName: "Cynthia Lummis", heldBy: "Republican", rating: "SR", note: "Safe Republican", candidateStatus: "Incumbent running; no competitive general-election path is apparent.", polling: "No competitive public polling found.", previousResults: "2020 Senate: Lummis 73.1%, Ben-David 26.9%. 2024 President: Trump carried Wyoming by one of the largest margins in the country.", demographicTrends: "Small, overwhelmingly Republican federal electorate.", analysis: "Wyoming is Safe Republican.", ratingHistory: [{ date: "2026-07-06", rating: "SR", note: "Initial Senate board rating" }], lastUpdated: "2026-07-06", sources: ["U.S. Senate Class II roster", "Ballotpedia 2026 Senate elections"] },
  ],
};

const SENATE_SOURCE_LINKS = {
  "U.S. Senate Class II roster": "https://www.senate.gov/senators/Class_II.htm",
  "Ballotpedia 2026 Senate elections": "https://ballotpedia.org/United_States_Senate_elections,_2026",
  "Ballotpedia 2026 Senate battlegrounds": "https://ballotpedia.org/U.S._Senate_battlegrounds,_2026",
  "270toWin Cook Political Report ratings": "https://www.270towin.com/2026-senate-election/cook-political-report-2026-senate",
  "270toWin 2026 Senate polling": "https://www.270towin.com/content/2026-senate-polling",
  "Cook Political Report race summary": "https://www.cookpolitical.com/senate/race/488686",
};

/* ------------------------------------------------------------
   2024 TRACK RECORD
   The headline numbers plus the breakdown that actually matters
   — how you did on races that were genuinely contested, not the
   uncontested ones anyone could have called.
------------------------------------------------------------ */
const TRACK_RECORD_2024 = {
  headline: {
    presidentialStatesCorrect: 48, // SAMPLE — confirm your real figure
    presidentialStatesTotal: 50,
    senateCorrect: 33, // SAMPLE — confirm your real figure
    senateTotal: 34,
  },
  // The number that matters more than the headline: how you did
  // specifically on races that were NOT foregone conclusions.
  // Fill this in honestly — it's the figure worth leading with.
  competitiveBreakdown: {
    definition:
      "Races rated Toss-up or Lean (either party) in the final week before election day.", // SAMPLE definition — adjust to match your own methodology
    presidentialTossUpsCorrect: 0, // TODO — fill in
    presidentialTossUpsTotal: 0, // TODO — fill in
    senateTossUpsCorrect: 0, // TODO — fill in
    senateTossUpsTotal: 0, // TODO — fill in
  },
  misses: [
    // List every race you called wrong, plainly. Credibility comes
    // from showing the misses next to the hits, not hiding them.
    // { race: "Example state", called: "R", actual: "D", note: "Late polling break missed" },
  ],
};

/* ------------------------------------------------------------
   METHODOLOGY — short bullet points rendered on methodology.html
------------------------------------------------------------ */
const METHODOLOGY = {
  summary:
    "Mustycaribou Forecasts combines polling, electoral history, demographic trends and informed political judgement to produce independent election forecasts. Ratings are based on the balance of available evidence and are updated as that evidence changes.",

  inputs: [
    "Polling averages and recent public surveys.",
    "Historical voting patterns and partisan lean relative to national lean.",
    "Candidate quality, incumbency and campaign environment.",
    "Demographic trends and regional political change.",
    "National political environment.",
    "Forecaster judgement where the evidence requires context."
  ],

  limitations: [
    "Forecasts cannot anticipate every late-breaking event.",
    "Individual polls are not followed in isolation.",
    "Margins are less reliable where polling is sparse.",
    "Ratings are based on information available at the time and can change as evidence changes."
  ],
};
const accuracyMap = [
  {
    state: "Texas",
    race: "Senate",
    status: "wrong",
    predicted: "Likely R",
    actual: "Lean R",
    reason: "I underestimated how close the race would become and over-weighted Republican fundamentals."
  },
  {
    state: "Georgia",
    race: "President",
    status: "correct",
    predicted: "Republican",
    actual: "Republican",
    reason: "Correctly identified the Republican trend in the state."
  }
];
