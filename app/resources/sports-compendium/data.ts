// Auto-generated from "{RESC} RIFT Equine Sports Compendium.pdf" — content authored by The Rift team & staff.
export interface CompendiumLink {
  text: string;
  url: string | null;
}

export interface BasicVocabSection {
  name: string;
  content: string;
  links: CompendiumLink[];
}

export interface Discipline {
  category: "English Sports" | "Western Sports" | "Racing" | "Other";
  name: string;
  the_sport: string;
  key_terms: string;
  judging: string;
  attire: string;
  extra_links: CompendiumLink[];
}

export const BASIC_VOCAB: BasicVocabSection[] = [
  {
    name: `Horses Specific`,
    content: `• Foal - A young horse under a year of age.
• Weanling - A foal that is being weaned from its mother's milk, typically around 4 to 6 months old.
• Yearling - A young horse between the ages of 1 and 2. Early adolescent and are not fully mature.
• Colt - A male horse younger than 4 years old
• Filly - A female horse younger than 4 years old
• Gelding - A castrated male horse
• Stallion - Male horse older than 4 years and is intact/has not been gelded
• Stud - A stallion used for breeding
• Sire - Male parent of a horse
• Mare - Fully mature female horse of breeding age, usually around 3 years or older
• Broodmare - A mare used primarily for breeding
• Dam - Female parent of a horse
• Green Horse - This refers to the level of experience in a horse. They are usually young and/or inexperienced under saddle.`,
    links: [],
  },
  {
    name: `Gaits`,
    content: `• Gait - The different patterns (based on foot falls) of locomotion that a horse uses to move. There are four natural gaits all horses have: walk, trot, canter, and gallop.
• Suspension - the moment when all of the horse’s hooves are off the ground.
• Collected -
• Working -
• Extended -
• Rein Back/Backing - a 2 beat diagonal gait with no suspension going backwards vs forwards.
• Halt - bringing the horse to a complete stop and standing still
• Walk - a natural, four-beat gait. It's the slowest of the horse's gaits and is characterized by a regular 1-2-3-4 beat where the legs move independently. Specifically, the sequence is left hind, left front, right hind, right front.
• Jog - More often seen in Western disciplines, the jog is a slow, steady, and rhythmic trot. A good jog should be smooth and even. Unlike the trot, the jog has a smaller moment of suspension between steps.
• Trot - A two-beat diagonal gait where the horse's legs move in diagonal pairs, with a moment of suspension in between each beat.
• Lope - A slow, steady, and generally relaxed variation of the canter. It's often seen in Western riding and is characterized by a relaxed, collected posture and a slower pace than a traditional canter. The lope is known for its smooth, easy rhythm and is commonly used in Western pleasure and other Western riding disciplines.
• Canter - A 3-beat gait with a moment of extension after. The horse will have a leading front leg that extends farther than the others. The correct leading leg is the one on the inside, or the one closest to the center of the arena. So if your horse’s left shoulder is on the wall and their right shoulder is on the inside, the right lead is correct. The horse will take off on its hind leg opposite the canter lead, then the diagonal pair will move forward, and then their leading leg. For example, in the right lead, the horse will start on their hind left, then their front left and hind right will move together, and then finally their leading front right leg will stride forward.
• Hand Gallop -
• Gallop - the fastest gait a horse can perform, characterized by a four-beat rhythm where all four feet are off the ground at some point during each stride. It's a bounding gait, essentially a fast run, and is used when a horse needs to move quickly or escape danger.`,
    links: [{ text: `(1382) Gaits and Footfalls of the Horse with Julie Goodnight - YouTube`, url: `https://www.youtube.com/watch?v=Kh3XWd64Kk4` }],
  },
  {
    name: `Tack`,
    content: `• Tack - refers to all gear on a horse for riding or driving.
• Saddle - piece of tack on the horses back that the rider sits in
• Bridle - piece of tack worn on the horses head for communication and steering
• Saddle Pad - cloth that goes under the saddle to absorb shock and prevent friction
• Breast Collar - also known as a breastplate, it attaches to a saddle to prevent it from slipping/sliding backwards.
• Bell Boots - A boot designed to protect horses who overreach and to protect hooves in rough terrain. (Overeaching is when the hind hoof strikes the heel of the front hoof)
• Girth - The band fastened around the horse's belly to secure the saddle.
• Halter - The head collar around the horse's head that is used for leading and tethering.
• Boots - there are many types of boots but they are all designed to protect some part of the horse’s legs. There are tendon boots, fetlock boots, brushing boots, stable boots, shipping boots, etc.
• Rein - the strap connected to the bridle that riders use to help steer.
• Shoe - what goes on the bottom of the horse’s hoof to help protect from injury and depending on the shoe help with ailments, injuries, and shock absoption.
• Stirrup - A loop shaped piece of metal, plastic, or wood that is attached to the saddle where the rider places their feet.`,
    links: [{ text: `Western vs. English Riding Gear key Difference and Uses - Huntley – Huntley Equestrian`, url: `https://www.huntleyequestrian.com/blogs/press/western-vs-english-riding-gear-key-difference-and-uses` }, { text: `A beginner’s guide to saddles`, url: `https://horseandcountry.tv/a-beginners-guide-to-saddles` }, { text: `The complete guide to horse bridle types`, url: `https://horseandcountry.tv/complete-guide-to-horse-bridle-types` }, { text: `Types of Western Bridles | Schneiders Blog.`, url: `https://www.sstack.com/blog/product-guides/your-guide-to-the-different-types-of-western-bridles/b/r0162/?srsltid=AfmBOorNdx9-6eZa6cVbGUv8w6B_L1B9qAC5Vpt4YVdoIGOV0atEHxKv` }],
  },
  {
    name: `Behavior`,
    content: `• Balk/Balking - stopping abruptly and refusing to move forward
• Bolt/Bolting - when a horse panics and takes off at high speeds and typically refuses to slow down for a time
• Buck - when a horse kicks their hind quarters out, usually accompanied by lowered head and rounded back
• Rear - when a horse lifts their front legs and shifts weight to their hind legs basically standing vertically
• Shying - when a horse jumps or moves sideways away from something`,
    links: [],
  },
  {
    name: `Riding Specific`,
    content: `• Aids - anything used to communicate with the horse. Natural aids include legs, hands, voice, seat, etc. Artificial aids include whips, crops, spurs, etc.
• Conformation - horses physical shape, structure, body proportions, and alignment. This all effects a horses balance, athletic ability, movement quality, and soundness.
• Equitation - the art of horse riding, the riders correct position, balance, and effective use of aids.
• Lead - refers to the front leg that reaches furthest and strikes the ground last during a canter or gallop. Horse on the correct lead will lead with the inside leg corresponding with the direction of the turn.
• Stride - a complete 4-phase cycle of horses movement defined by their sequence of footfalls.
• Slice - approaching a jump at a sharp angle vs straight on
• Impulsion - an energetic and controlled thrust from the horse's hind legs. Typically most common in jumping.
• Refusal - when a horse stops in front of an obstacle instead of clearing it
• Run-out - when a horse moves sideways from a jump and still goes forward, missing the jump.

English Sports`,
    links: [],
  },
];

export const JUMP_TYPE_IMAGES: CompendiumLink[] = [{ text: `Vertical -`, url: `https://www.saddlebox.net/wp-content/uploads/2018/02/jump2.jpg` }, { text: `Oxer`, url: `https://ecdn.speedsize.com/1e7c580d-ad97-4270-aca5-5910d34af508/https://a.storyblok.com/f/270947/1024x1536/e4f6679870/parallelloxer.jpg?speedsize=w_2048` }, { text: `Triple Bar`, url: `https://ecdn.speedsize.com/1e7c580d-ad97-4270-aca5-5910d34af508/https://a.storyblok.com/f/270947/1024x1536/7a01cd9a13/trippelbarr.jpg?speedsize=w_2048` }, { text: `Water jump`, url: `https://i.pinimg.com/474x/3b/9d/9e/3b9d9e0477a07bacc0e9c697f0e4d0e2.jpg` }, { text: `Liverpool`, url: `https://www.budgetequestrian.com/wp-content/uploads/2019/08/liverpool-horse-jump.jpg` }, { text: `Crossrail`, url: `https://frowenandridge.wordpress.com/wp-content/uploads/2015/03/p1000887.jpg` }, { text: `Wall -`, url: `https://dalmanjumpco.com/cdn/shop/products/castle-wall-grey_1200x1200.png?v=1751257917` }, { text: `Plank -`, url: `https://alujumpsusa.com/Images/planks2.jpg` }];

export const DISCIPLINES: Discipline[] = [
  {
    category: "English Sports",
    name: `Cross Country`,
    the_sport: `The point of cross country is to demonstrate excellence in speed, endurance, and jumping. It also demonstrates the rider's ability to pace and navigate the course and its jumps effectively. It consists of a course with obstacles at an appropriate speed for the level. The course is held outside, and horses travel a set distance over “natural” obstacles, though things can be added to test a horse's bravery.`,
    key_terms: `XC - another way to say/write Cross Country
Optimum Time - Can be an exact time or time frame, is the desired time for the course.
Time Limit - The max time a course can take, can be DQ if you exceed the time limit.
Start Box - Where the horse starts the course and the timer starts
Overtaking- any athlete who is about to be overtaken by a following athlete must quickly clear the way. An athlete overtaking another athlete must do so only at a safe and suitable distance
Refusal- a horse stops in front of an obstacle to be jumped
Runout- when a horse moves sideways from a jump and still goes forward, missing the jump
Missed marker- if the horse’s head, neck, and both shoulders do not pass through the obstacles markers
Circles- done after a refusal/runout to attempt obstacle again
Willful Delay- if the horse halts, walks, circles, or serpentines between the last fence and the finish line to delay finishing Types of obstacles/jumps
Arrowhead- also known as chevrons; shaped like a triangle with point facing the ground; usually only a few feet wide
Bank- steps up or down from one level to another
Brush fence- solid base jump with brush on top
Bullfinch- solid base jump with several feet (up to 6 feet) of brush on top
Coffin- combo jump of rail-ditch-rail; horse will jump a rail, then one or several strides downhill to a ditch, and then uphill to another jump
Coop- triangular obstacle shaped like the roof of an A-Frame house
Corner- triangular jump; meant to jump one corner of the triangle
Ditch- dropped areas in the course
Drop fence- horse jumps a log fence and lands at a lower level than they took off at;
Keyhole- a jump the horse jumps through
Log Fence- A fence that’s a log
Normandy Bank- a combination of obstacles; a ditch precedes the bank; bank must have a jump on top; ditch and bank must be jumped in one leap
Ramp- half of a coop
Rolltop- rounded half-barrel appearance on top
Skinny- any fence with a narrow face
Sunken Road- combination of jumps involving banks and rails;
Table- a fence with width and height with the top being one piece of material
Tiger Trap- a type of open-spread fence
Trakehner- a rail over a ditch
Wall- a wall of solid stone or wood blocks
Water-Crossings- a combination of jumps that can include a jump into the water, obstacles in the water, and/or a jump out of the water`,
    judging: `Winning generally goes to the person with the lowest set of points. This generally means who is closest to the optimum time with the least amount of penalty points, as going over or under the optimum time results in penalty points. Hosts have different ways of judging so always check with the host. Generally speaking, if you fall off, that is considered a disqualification (DQ).`,
    attire: `Protective Headgear- helmet of any color
Shirt- light-weight; can be any color
Gloves- optional; can be any color
Breeches- can be any color
Boots- black, brown, or any dark hue; modest piping of a different color is permitted`,
    extra_links: [{ text: `Jung, Collett and Burton WOW in individual eventing after Day 2 | Paris Olympics | NBC Sports`, url: `https://www.youtube.com/watch?v=CY2UxFRrCAQ` }, { text: `Maryland 5 Star 2024: Day 3 Cross Country`, url: `https://www.youtube.com/watch?v=Taq7Q8Xp1FY` }],
  },
  {
    category: "English Sports",
    name: `Dressage`,
    the_sport: `Dressage (from a French word meaning “to train”) is a sport that explores developing a horse through gymnastic training and is sometimes referred to as a dance. It is a showcase of the harmony between horse and rider, designed to teach the horse to carry the weight of a rider in a balanced & biomechanically healthy way. Not only this, but the sport also explores the rideability, balance, and strength that a horse and rider can perform through self-carriage. This is a flat sport, relying on movements in the walk, trot, and canter usually in a standard 20x40m or 20x60m ring. The ring is typically outlined with low to the ground white partitions with letters spaced out along the edge. The letters consist of A K E H C M B F. In a 20x60m ring, additional letters V S R and P are added along the sides. Along the centerline in the middle of the arena are “imaginary” letters D L X I G. The rider can use these as markers for their movements for where specific movements begin, end, or change.

In competition there are two forms of Dressage. There are Tests which are a predetermined pattern that a rider must follow. Then there is Freestyle which is where a rider and horse choreograph their routine to music.`,
    key_terms: `Aid: A signal given by the rider to communicate with the horse & influence its movement or balance. Aids can include the use of seat, legs, hands, spur, whip, etc.
Centerline: A straight line between A and C. (lengthwise down the middle of the arena). Riders enter the arena at A and ride down this line to C to begin their test.
Quarterline: A straight line that runs parallel to the long side of the arena, this is exactly halfway between centerline and edge of arena.
Diagonal: A straight line ridden at a diagonal angle across the arena between two points/letters, often used to change direction smoothly. It may be ridden with the horse straight on the line, or it may be used as the line of travel for lateral movements such as the halfpass.
Frame: The overall outline or posture of the horse’s head, topline and body while moving.
Bend: The lateral curve of the horse’s body from its poll to its tail, usually around the rider’s leg.
Flexion: The lateral turning of the head/neck only at the poll.
Track: Can have a few meanings - the line of travel of the horse, the line of travel of a hoof on the ground, and the path around the edge of the arena.
Rhythm: This is the characteristic sequence of footfalls and phases of each gait.
Suppleness: The horse's ability to remain fluid and balanced through each movement.
Impulsion: The power in which the horse moves forward.
Straightness: When the horse’s hind feet track in line with the forefeet, and the body is aligned with the line of travel (for example, a horse can move “straight” on a circle if its shoulders and haunches don’t fall in or out of the line of travel)
Engagement: The engagement of the horse’s hindquarters, where the hind legs step further underneath the body, articulation of the pelvis, stifles, hocks and fetlocks, allowing the horse to carry more weight behind & lightening the front end
Cadence: The expressive quality & regularity of steps within a gait, often seen as a clear rhythm or emphasized beat in a horse’s motion.
Capriole: A complex move under the Airs Above the Ground category. This is when the horse leaps into the air with the forelegs tucked under the chest and kicks the hind legs behind. All four legs should land at the same time.
Collection: When a horse is physically developed enough to draw its body together to carry more weight on its hind legs than the front legs, shortening the gaits and pushing forward with the hind end rather than pulling forward with the front end.
Self-Carriage: The horse is able to maintain balance, rhythm, frame and forwardness without relying on constant support from the rider’s aids.
Contact: This is the steady, soft and elastic connection between the rider's hands and the horse’s mouth through the reins and bit. The rider needs to maintain contact to apply Aids.
Courbette: Under the Airs Above the Ground Category. The horse stands and balances on hind legs and jumps forward several times before returning forelegs to the ground.
Extension: Increasing the length & ground-cover of the stride while maintaining rhythm & balance, allowing the horse to have greater reach without rushing.
Lateral Movements: Movements where the horse is slightly bent & travels on multiple tracks, with the forehand and hindquarters following different lines of travel. This can portray strength, balance, and cadence.
Lead: In the canter, the lead refers to which front leg reaches farther forward and lands last in the three-beat sequence. It typically corresponds with the direction the horse is traveling or bending.
Levade: This move is under the Airs Above the Ground Category. The horse balances on hindlegs and keeps hocks lowered close to the ground while elevating the forehand and tucking forelegs under the chest.
Loop: A shallow serpentine where the riders leave the wall to a marker and return on the long side.
Half-halt: A brief aid in which the rider applies both a driving aid and a restraining aid in quick succession then immediately softens, to rebalance the horse and recycle forward energy back to the hindquarters. This helps shift weight off the forehand & engage the hind end.
Leg Yield: A movement where the horse moves forward & sideways while the body remains straight, maintaining slight flexion away from the direction of travel.
Shoulder-in: A three-track movement where the horse is bent around the rider’s inside leg, and the shoulders are brought slightly to the inside of the track while the hindquarters remain on the line of travel.
Haunches-in / Travers: A four-track movement where the horse is bent in the direction of travel, and the hindquarters are moved to the inside while the shoulders remain on the line of travel.
Haunches-out / Renvers: Inverse of Travers. The horse maintains bend in the direction of travel while the hindquarters are moved to the outside and the shoulders remain on the line of travel.
Half-pass: An advanced lateral movement where the horse moves forward and sideways at the same time while bent in the direction of travel, crossing the legs and traveling diagonally.
Piaffe: This is a type of gait. This is a highly collected and elevated trot with minimal forward movement. Horse should appear to trot on the spot with their hind end tucked in and forehand open and active.
Passage: A collected gait often seen at high levels in dressage. This is a very elevated and cadenced trot that emphasizes engagement and joint flexion. This gait has prolonged moments of suspension.
Turn on the forehand/haunches: Turn on the forehand is where the horse turns around the forehand while hind legs step around and cross, with the front legs taking small steps in place. The turn on the haunches is the same except the horse is pivoting around the hind end.
Pirouette: A turn in which the horse rotates around the hindquarters while maintaining the rhythm of the gait. Pirouettes are typically performed in a highly collected canter.
Rein-back: A controlled backward movement where the horse steps backwards in diagonal pairs while remaining straight and balanced, with the horse maintaining his desire to move forward.
Counter-Canter: This is a canter that is done on the outside lead. This tends to be the opposite lead from the direction you are going. I.E if you are tracking to the left, the horse will use their right lead.
Tempi Change: This is a sequence of flying changes that are performed every single, every two, every three, or every fourth stride.
Serpentine: This is a series of half circles along the long side of the arena that alternate directions and is shaped like a snake. The rider will circle out to the centerline and circle back into the long side and repeat that for the length of the arena.
Simple lead change: This is a change of lead by bringing the horse to a walk or trot and switching from one lead to the other.
Flying lead change: A change of lead performed during the moment of suspension in the canter, without breaking gait.
Pessade: Similar to the Levade but performed at a steeper angle, where the horse raises the forehand into the air while balancing on the hind legs without forward movement
Volte: A small circle with a diameter of 6, 8, or 10 meters. This requires balance.
Demi-Volte: “Half-Volte,” a small half-circle of 6, 8, or 10 meters in diameter, often followed by returning to the track on a diagonal line. Often referred to for its “teardrop” shape.`,
    judging: `Judging is based on movement combinations, scoring each individual movement based on the horse’s way of going and the accuracy of the figures ridden. Tests will grow in complexity as the rider moves up levels.

The scoring is 1-10 with half scores allowed: 10= Excellent 9= Very Good 8=Good 7=Fairly Good 6=Satisfactory 5=Sufficient 4=Insufficient 3=Fairly Bad 2=Bad 1=Very Bad 0=Not Performed

Then you have Collective Marks (on a National Level). These have scores for Gaits, Impulsion, Submission, Rider’s Seat and Position, and the Rider’s Correct and Effective Use of the Aids.

In Freestyle judging, scoring is divided between Technical Marks (50%) which evaluate each movement performed for accuracy/correctness, and Artistic Marks (50%) which evaluate choreography, harmony, difficulty, and interpretation of the music.

For the final score, the total is found by the points earned divided by points possible. The highest percentage score wins. Most competitive riders score between 65-75%, while higher level performers may score 80% or higher.`,
    attire: `CASUAL/SCHOOLING ATTIRE: A typical schooling outfit might include light-colored (beige or white) breeches but can be any color, tall riding boots, gloves, a long-sleeved shirt of any color, and a helmet. Rounded/blunt dressage spurs and a dressage whip are sometimes used as refining aids when appropriate.
COMPETITION ATTIRE: According to the USEF/USDF, competitive dressage attire requires a polished, traditional, professional appearance including:
Pants/Breeches - white, light, or dark colored breeches or jodhpurs are permitted, bright colors or patterns are not permitted.
Boots - tall English-style riding boots (dress or field) and must be black, brown, or a color matching the coat.
Coat - a short riding jacket/coat for most levels, a tailcoat/shadbelly may be worn at higher levels. Any single-color riding coat is permitted, but patterns such as stripes or polkadots are prohibited. Tasteful accents such as a collar/cuffs of a different color are permitted.
Shirt - a formal shirt of any color (white/cream are recommended) worn under the coat with a collar or stock tie.
Gloves - white or light colored gloves are recommended in lower levels, while black/brown/white gloves are required in higher levels.
Headgear - all riders at every level must wear helmets while mounted on competition grounds. The previous exceptions allowing top hats at high levels were removed in 2021.
Whips - whips are permitted in lower-level non-championship dressage competitions, limited to one whip with a maximum length of 120cm. At high levels, whips are allowed in the warm-up arenas but forbidden in the competition ring.
HORSE TACK: Tack must be clean and correctly fitted to the horse and rider.
Saddle - dressage-style saddle must be well-fitting and have long, near-vertical flaps,
English-style or safety stirrups and a girth.
Saddle pads - should be white or off-white. Contrast coloring & piping is allowed, but western-style pads, striped or multi-color pads are not permitted.
Bridle - must be English-style with a noseband, browband, and throatlatch.
HORSE APPEARANCE: Horses should be clean, well-presented, and in good condition with a tidy mane and tail. While there are no rules requiring horses’ manes to be braided, secure braiding is recommended for a professional, polished appearance. Manes that are left natural must be tidy and neat in appearance.`,
    extra_links: [{ text: `Dressage Overview`, url: `https://madbarn.com/equestrian-dressage/` }, { text: `Additional Dressage Terms`, url: `http://www.dressageshowinfo.com/images/DressageTerminology.pdf` }, { text: `Dressage Test Example`, url: `https://youtu.be/EGS14okZTSw?si=hCjC1Z55OYh5wi0X` }, { text: `Dressage Freestyle`, url: `https://youtu.be/adcsbxOmq3c?si=DKX1FCGTrQ9vM3kU` }, { text: `Dressage Freestyle II`, url: `https://youtu.be/zinL21uZpp8?si=Dj25gJBsP7Kumvkk` }, { text: `Biomechanics of Engagement`, url: `https://www.youtube.com/watch?v=YfYEAHXGjBE` }, { text: `USDF 2023-2026 Test PDFs`, url: `https://www.usdf.org/downloads/forms/index.asp?TypePass=Tests` }, { text: `FEI Dressage Tests`, url: `https://inside.fei.org/fei/your-role/organisers/dressage/tests` }, { text: `Collected Canter & Piaffe at Liberty`, url: `https://www.youtube.com/shorts/UGSeoINOq98` }],
  },
  {
    category: "English Sports",
    name: `English Pleasure`,
    the_sport: `English Pleasure is an umbrella class category of English riding classes where horses are judged on their manners, way of going, and suitability as a “pleasant” riding horse that anyone would feel confident & safe riding. The goal is to display a horse that is relaxed & balanced while responding willingly and promptly to the rider’s aids. English Pleasure classes are usually rail classes, meaning horses travel around the arena perimeter together while judges evaluate their movement & behavior in various gaits. English
Pleasure is divided into several sub-categories including Hunt Seat Pleasure, Saddle Seat Pleasure, and Pleasure Driving. While each division is unique, they all emphasize that the horse must be pleasant & enjoyable to ride/drive.

Hunt Seat Pleasure is influenced by fox-hunting traditions and is judged on manners, obedience, consistency, movement, and overall appearance. Horses are ridden on a soft contact with a similar movement to Hunter Under Saddle horses (long/low ground-covering stride, reaching forward with steady movement), but typically with a more relaxed/extended frame. Some of the most common breeds include Thoroughbreds or TB crosses, Warmbloods, Quarter Horses, and Morgans.

Saddle Seat Pleasure is the English Pleasure division ridden in the Saddle Seat style. It highlights animation, presence, brilliance, and movement alongside elegance & style. Horses are shown with a higher head carriage and more elevated knee action than in Hunt Seat, while remaining balanced & a true “pleasure” to ride. Saddle Seat is sometimes mistakenly confused with the “Big Lick” style seen in some Tennessee Walking Horse competitions, however, Saddle Seat is an entirely separate discipline with different breeds/traditions and judging criteria, and the use of practices which utilize pain to exaggerate movement are strictly prohibited. Typical gaits include walk/trot/canter, with additional gaits such as the slow gait and rack required in certain breed divisions. Common breeds include American Saddlebreds, Arabians, Morgans, and Hackneys.

Pleasure Driving judges horses pulling a two or four-wheeled carriage/cart rather than being ridden, and horses should move freely & comfortably while demonstrating good manners and responsiveness with the goal being to show a horse that is a “pleasure” for anyone to drive. Gaits that are usually called include walk, slow trot, normal/working trot, strong trot, halt, and reinback. Common breeds include Hackney ponies, Morgans, Saddlebreds, and Welsh Ponies.`,
    key_terms: `HUNT SEAT PLEASURE
Rail Class - a class where multiple horses & riders travel around the arena together while judges evaluate them while calling for different gaits & directions.
Reverse - a change of direction in the arena, typically turning inward towards the center of the ring.
Posting Trot - a riding technique where the rider rises and sits in rhythm with the horse’s trot.
Two-Point Position - a riding position where the rider’s seat is slightly out of the saddle, placing their weight into the stirrups, leaving only two points of contact with the horse.
Way of Going - an overall evaluation of the horse’s movement, rhythm, balance, and suitability as a pleasure horse.
Line Up - when riders halt their horses and line up side-by-side for final inspection by the judge. SADDLE SEAT PLEASURE
Park Trot - a highly animated trot with elevated knee action and expressive movement (with the forearm horizontal or higher), characteristic of Saddle Seat horses.
Slow Gait - a slow, highly collected four-beat ambling gait performed by certain gaited breeds.
Three-Gaited - a class division in which horses perform walk, trot and canter
Five-Gaited - a class division in which horses perform walk, trot, canter, slow gait, and rack
Rack - a smooth, high-speed, four-beat lateral gait with high knee & hock action performed by certain gaited breeds.
Brilliance - a judging term describing a horse’s overall animation, presence, and expression in the ring.
Animation - the high-energy, expressive, high-head carriage and high-stepping way of moving that showcases a horse’s presence and athleticism in the ring. PLEASURE DRIVING
Driver - the person controlling the horse & carriage/cart.
Lines - the reins used by the driver to guide the horse from the carriage/cart.
Harness - a multi-part piece of equipment with various straps & padding which connects a horse to a cart/carriage, allowing it to pull the weight comfortably
Vehicle/Cart - the carriage or cart being pulled by the horse.
Turnout - the overall appearance / presentation of the horse, harness, vehicle, and driver.
Slow Trot - a controlled and comfortable two-beat gait with less speed and shorter, more elevated strides than a working trot.
Strong Trot - a balanced, free-moving trot with a significantly lengthened stride and increased energy with the horse moving with purpose and appearing to “push” the cart instead of dragging it.
Stand - a command where the horse must remain quietly halted while hitched to the cart/carriage.
Reinback - the horse steps backwards in diagonal pairs in an unhurried manner, pushing the carriage back in a straight line. The horse then moves forward willingly to the former position.
Manners - the horse’s behavior and responsiveness, including calmness, obedience, and willingness.`,
    judging: `In English Pleasure classes, judges evaluate the horse’s manners, way of going, and suitability as a pleasant riding horse. Horses should move with willingness, steady rhythm, balance & relaxation while promptly responding to the rider or driver’s aids. The horse that appears to be the most “pleasure” to ride or drive is typically favored by the judges.`,
    attire: `HUNT SEAT PLEASURE: Protective headgear / helmet, a coat/jacket in either a navy, dark green, or black color, a plain white collared shirt with optional stock tie, light-colored breeches in beige or tan shades, tall leather riding boots, and optional gloves & solid-colored belt. English style saddle (typically close-contact or hunt-seat style), bridle with noseband, saddle pad in a conservative color (usually white or neutral tones)
SADDLE SEAT PLEASURE: Informal attire includes a suit (matching coat & jodhpurs in a conservative color), collared shirt, tie, vest, gloves, jodhpur boots in a complimentary color, and a derby hat or protective headgear. Acceptable informal colors include black, blue, grey, burgundy, green, beige or brown. Formal attire includes a tuxedo-type jacket, matching jodhpurs, formal shirt, bow tie, vest, gloves, jodhpur boots, top hat (women) or homburg (men) or protective gear. Acceptable formal colors include dark grey, dark brown, dark blue, or black. Saddle seat saddle with a flat seat & long flaps, full double bridle with curb bit and bradoon snaffle, curb chain, decorative browband (often with colored stones or ornamentation), saddle pad in white or conservative color
PLEASURE DRIVING: Drivers typically wear traditional, neat, conservative attire including a jacket/coat, collared shirt & tie, long trousers and sturdy boots or driving shoes. hat (driving/derby hat or helmet), gloves, and a driving apron or knee rug worn over the lap while seated in the cart/carriage. Tack requirements include a full driving harness (consisting of bridle with blinkers/blinders, breastcollar or collar harness, traces connecting the harness to the cart/carriage, saddle/backpad supporting the harness on the horse’s back), driving lines, breeching/braking system, appropriate cart or carriage vehicle.`,
    extra_links: [{ text: `What Is Hunt Seat?`, url: `https://www.youtube.com/watch?v=lM2EAptq8K0&t=2s` }, { text: `What is Saddle Seat?`, url: `https://www.youtube.com/watch?v=0kUChT-tXes` }, { text: `All About Carriage Pleasure Driving`, url: `https://files.usef.org/assets/jcSI696SESY/2016-carriage-pleasure-driving-online.pdf` }, { text: `AQHA Amateur Pleasure Driving Class`, url: `https://www.youtube.com/watch?v=BGQdUlXeIpg` }, { text: `English Pleasure Hunt Seat Open Class`, url: `https://www.youtube.com/watch?v=I_rcyVardPo` }, { text: `Friesian Saddle Seat Pleasure Class`, url: `https://www.youtube.com/watch?v=jcDBRrZ4fIs&t=65s` }, { text: `Saddle Seat vs Big Lick - NOT the same!`, url: `https://www.youtube.com/watch?v=ZfjwpgzdLJU` }],
  },
  {
    category: "English Sports",
    name: `Eventing`,
    the_sport: `Eventing is an equestrian event similar to a triathlon, where the same horse and rider combination compete in three phases - Dressage, Cross-Country (also referred to as XC), and Show Jumping. Competitions may be held in either a Short-Format or
Long-Format event (formerly referred to as One-Day or Three-Day events). It was also previously known as Combined Training, and still is in some smaller organizations.
The three-phase competition always follows the same order: Dressage first, followed by
Cross-Country, and ending with Show Jumping. Dressage consists of a standardized test (rather than freestyle) to test relaxation, balance, and harmony with the rider.
Cross-Country evaluates endurance, bravery and agility over a variety of terrain and solid obstacles (courses can range from 12-20 obstacles or 30-40 depending on the level). The final phase is Show Jumping, which tests the horse’s athleticism & adjustability and usually consists of 12-20 fences. For more detailed information about Dressage, Cross-Country, and Show Jumping, refer to their individual sections.`,
    key_terms: `Horse Trial- Comprised of three phases: dressage, cross-country, and show jumping. Held over 1 or more days, where the athletes ride the same horse throughout all three phases. Dressage must be first, followed by cross country and show jumping (in either order according to the FEI).
Classic Three-Day Event- Comprised of three phases, dressage, XC, and show jumping, all held on separate days and using the same horse throughout. Dressage is held first (over 1 or more consecutive days), followed by XC, and ending with show jumping.`,
    judging: `Eventing is scored on a penalty-based system with the goal of having the lowest total penalty score at the end of the three phases. In Dressage, judges award marks from 0-10 for each movement which are then totaled, converted into a percentage out of possible points, and subtracted from 100 to produce a penalty score. In Cross-Country, penalties are added for things like refusals, run-outs, falls, or exceeding optimal time. In Show Jumping, penalties are added for things like knocked rails, refusals, and time faults. All penalties from each phase are totaled, and the rider with the lowest total score wins. For judging specific to Dressage, see the Dressage judging section.
For judging specific to Cross-Country, see the Cross-Country judging section. For judging specific to Show Jumping, see the Show Jumping judging section.`,
    attire: `For attire specific to Dressage, see the Dressage attire section.
For attire specific to Cross-Country, see the Cross-Country judging section. For attire specific to Show Jumping, see the Show Jumping judging section.`,
    extra_links: [{ text: `What Is Eventing? By FEI`, url: `https://www.youtube.com/watch?v=3PTmMLZUirA` }, { text: `Eventing: 5 Things to Know`, url: `https://www.youtube.com/watch?v=BaFmotWoKvo` }, { text: `Munson Slew Cross Country at 2021 Maryland 5* at Fair Hill`, url: `https://www.youtube.com/watch?v=9McXgECA51Q` }, { text: `Lissavorra Quality Cross Country at 2025 Mars Bromont CCI`, url: `https://www.youtube.com/watch?v=GDMcF74ruIQ` }, { text: `Michael Jung Dressage at FEI Eventing World Champs 2022`, url: `https://www.youtube.com/watch?v=sNJTv3ljk-M` }],
  },
  {
    category: "English Sports",
    name: `Foxhunting / Mock Hunt`,
    the_sport: `It came from Britain and evolved out of actual fox hunting, though nowadays is taken as more of a fun, traditional event for equestrians. Hunts are similar to a fast-paced hack, yet with a cross-country twist to them. Jumps are technically optional, though part of the fun. The turnout for planned mock hunts are usually quite big, so riders need to consider their own & their horse’s safety.`,
    key_terms: `Field Master: Sometimes called the “Master of the Foxhounds”, the person leading the group along a pre-determined route. Do not pass them.
First Field: Faster riders that are taking all jumps.
Second Field: Riders that are going at a slower, steady pace. Jumping is optional.
Hill toppers: The slowest group of riders. Usually do not jump at all.`,
    judging: `You can “win” a mock hunt by having fun There is no judging involved.`,
    attire: `Rider Helmet Safety Vest Black/Navy jacket Black Gloves White/Beige breeches Black riding boots Horse
Black/Brown English Tack: A bridle with one / two nosebands & a saddle with one girth White saddle pad
Optional: A matching breastplate`,
    extra_links: [{ text: `An Introduction to Foxhunting`, url: `https://www.youtube.com/watch?v=k2rCB0GpKu4` }],
  },
  {
    category: "English Sports",
    name: `Hunter Flat/Hunter Under Saddle`,
    the_sport: `Hunter Flat/Hunter Under Saddle is an English riding class judging a horse’s movement, conformation, and manners at a walk, trot, and canter. It focuses on a free-flowing, comfortable stride, a relaxed head carriage and an obedient temperament simulating a capable, pleasant field hunter which is evaluated without jumps.`,
    key_terms: `Halt: The horse is to ease into a nice halt and should not shift on its feet or try to turn away when performing the halt.
Walk: A natural, four-beat gait. It's the slowest of the horse's gaits and is characterized by a regular 1-2-3-4 beat where the legs move independently. Specifically, the sequence is left hind, left front, right hind, right front.
Collected Trot: The collected trot is often a shorter, higher stepping gait at a diagonal two-beat rhythm.
Working Trot: The working trot is the foundational diagonal two-beat rhythm with a more energetic pace than the collected trot.
Extended Trot: The extended trot is an advanced, high energy gait where the horse will maximise stride length and suspension without increasing tempo in a diagonal two-beat rhythm.
Collected Canter: The collected canter is a shorter, higher stepping stride in a three-beat rhythm.
Working Canter: The working canter is the foundational three-beat rhythm with a more energetic pace than the collected canter.
Extended Canter: The extended canter maximises the horse’s stride length allowing the horse to cover more ground without increasing tempo in a three-beat rhythm.
Backing: Reverse x amount of steps.
Change Direction: Changing direction should be done as smoothly as possible, complete a half circle and when you reach the peak of that circle keep a straight line to make a general tear drop like shape.
Circle: A circle performed to either slot yourself in behind the horse directly behind yourself or to create distance to the horse in front. The horse should maintain a nice, steady circle and go willingly to the rider’s directions without needing to be turned too sharply.
Quarterline: If you find yourself perhaps getting too close to the horse in front of you you can go onto the quarter line which is an invisible line a horse and a half length on the inside of the arena from the rail. You can use this as a means to pass the horse you may have found yourself getting too close to if a circle was not a viable action.
On The Rail: To ride along the arena wall/rail.`,
    judging: `Judging for Hunters Under Saddle is scored based on a horse's movement, manners and functional correctness across the walk, trot and canter in both directions. Some key factors to consider are:
Movement: The horse should demonstrate a long, ground-covering stride with a flat knee motion. The trot should be cadenced and balanced.
Headset: The horse’s head should be carried close to the withers with the nose slightly in front of the chest.
Manners: The horse must be quiet, obedient and responsive to their rider’s aids with minimal resistance.
Functionality: Correct gaits must be maintained.
Transitions: Prompt and smooth upward and downward transitions.`,
    attire: `Riders should wear a hunt coat in traditional, conservative colours (black, brown, navy or dark green) with a white shirt, white or tan jodhpurs, black boots and a helmet. Riders may also choose to wear white gloves.

Horses should be shown in black, preferably brown, tack. The saddle should have a single girth and the bridle must have one or two nosebands, the saddle pad must also be white. Horses' manes must be braided on the right side and the horse should be spotless clean.`,
    extra_links: [{ text: `https://www.uaex.uada.edu/farm-ranch/animals-forages/horses/hunter_under_saddl e.pdf`, url: `https://www.uaex.uada.edu/farm-ranch/animals-forages/horses/hunter_under_saddle.pdf` }, { text: `https://www.aqha.com/-/hunter-under-saddle-strategy`, url: `https://www.aqha.com/-/hunter-under-saddle-strategy` }],
  },
  {
    category: "English Sports",
    name: `Hunter Jump/ Hunter Over Fences`,
    the_sport: `Hunter Jump, also known as Hunter Over Fences, is a sport in which horse and rider go around a course of jumps while being judged on appearance and technique rather than speed. Most courses have 8-10 jumps, and the jumps have a natural looking appearance. Small walls, brush boxes, and gates adorned with greenery are all potential appearances for jumps, imitating natural obstacles that could be found in a hunt field. Hunter Over Fences courses are typically lower and simpler in design than Show Jumping courses. They often include basic straight and diagonal lines. Horse and rider turnout are particularly important, with the overall appearance and technique of a round determining a rider’s score.`,
    key_terms: `Round - The rider & horse’s trip around a course of jumps.
Turnout - The cleanliness and overall appearance of horse and rider. Good turnout includes elements like polished hooves, neat braiding, and a polished rider appearance.
Dock - The top portion of a horse’s tail.`,
    judging: `Hunter Over Fences is judged numerically, out of 100 points, with scores commonly ranging from the 60s (a round with notable issues) up to the 90s (a near perfect round). It is also judged subjectively, rather than time-based. Judges evaluate elements like a horse’s movement, straightness to jumps, and jump distances. Horses are expected to have a calm demeanor and proper shape over jumps.`,
    attire: `Riders wear hunt coats in traditional, conservative colors (black, navy, dark green, etc.) and white or tan breeches. Black or brown helmet, gloves, and boots. Hair must be neatly contained, often put into a hairnet. Horse’s mane (button braids) and dock of tail should be braided. Brown English saddle, either jumping or all-purpose, and a brown no-bling bridle. Snaffle, pelham, and full cheek bridle bits are legal. White saddle pad.`,
    extra_links: [{ text: `Example Hunter Over Fences Round`, url: `https://www.youtube.com/watch?v=r2KBPmW7qIM` }],
  },
  {
    category: "English Sports",
    name: `Saddle Seat`,
    the_sport: `Saddle Seat is a type of English-style riding that is meant to show the animation, presence and elegance of certain high-stepping breeds of horses. It was developed during the 19th century from park riding & carriage traditions, where riders showcased stylish horses with animated movement that were comfortable to ride. Riders aim to enhance the horse’s movement with minimal visible effort, sitting upright & farther back in the saddle with a long-leg stirrup position, allowing the horse’s front end to move freely. Saddle Seat competitions include a variety of divisions depending on breed, gait & presentation, such as Pleasure, Country Pleasure, Park, Three-Gaited, Five-Gaited, and Fine Harness. Common breeds found in Saddle Seat include American Saddlebreds, Morgans, Arabians, National Show Horses, and Hackney horses or ponies.

Saddle Seat is sometimes mistakenly confused with the “Big Lick” style seen in some Tennessee Walking Horse competitions, however, Saddle Seat is an entirely separate discipline with different breeds/traditions and judging criteria, and the use of practices which utilize pain to exaggerate movement are strictly prohibited.`,
    key_terms: `Action - the height & speed of the knee and hock movement
Animation - energetic, expressive movement recognized by elevated knee & hock action
Extension - the reach of a horse’s front legs
Brilliance - a horse’s overall presence & expression in the show ring
Frame - a horse’s overall body shape, including its head/neck carriage and body posture while moving
Posting Trot - a riding technique where the rider rises and sits in rhythm with the horse’s trot
Park Trot - a highly animated trot with elevated knee action and expressive movement (with the forearm horizontal or higher), characteristic of Saddle Seat horses
Slow Gait - a slow, highly collected four-beat ambling gait performed by certain gaited breeds
Rack - a smooth, high-speed, four-beat lateral gait with high knee & hock action performed by certain gaited breeds
Three-Gaited - a class division in which horses perform walk, trot and canter
Five-Gaited - a class division in which horses perform walk, trot, canter, slow gait, and rack
Pleasure - a division focusing on a stylish, animated horse that maintains good manners and responsiveness, being a true “pleasure” and comfortable to ride
Country Pleasure - a division emphasizing a quieter, softer way of going and greater suitability as a comfortable riding horse. Horses tend to move with less animation and slightly lower head carriage than Saddle Seat Pleasure.
Fine Harness - a driving class division where horses perform Saddle Seat gaits while pulling a carriage rather than being ridden`,
    judging: `Saddle Seat horses are mainly judged on their presence, way of going, flashy animation, high-stepping action, manners, and suitability for the division being shown. While various Saddle Seat divisions focus on different qualities, the same important underlying qualities must still be present, such as good manners, willingness, and consistency. Horses should move forward & freely while maintaining balance and a correct frame with minimal visible aids from the rider.`,
    attire: `Informal attire includes a suit (matching coat & jodhpurs in a conservative color), collared shirt, tie, vest, gloves, jodhpur boots in a complimentary color, and a derby hat or protective headgear. Acceptable informal colors include black, blue, grey, burgundy, green, beige or brown. Formal attire includes a tuxedo-type jacket, matching jodhpurs, formal shirt, bow tie, vest, gloves, jodhpur boots, top hat (women) or homburg (men) or protective gear. Acceptable formal colors include dark grey, dark brown, dark blue, or black.

Tack requirements include a Saddle seat saddle with a flat seat & long flaps, full double bridle with curb bit and bradoon snaffle, curb chain, decorative browband (often with colored stones or ornamentation), saddle pad in white or conservative color.`,
    extra_links: [{ text: `“What is Saddle Seat?”`, url: `https://www.youtube.com/watch?v=0kUChT-tXes&t=1s` }, { text: `“What is an American Saddlebred?”`, url: `https://www.youtube.com/watch?v=01kfxpQlZwU` }, { text: `USEF Friesian Pleasure Saddle Seat`, url: `https://www.youtube.com/watch?v=jcDBRrZ4fIs&t=48s` }, { text: `2021 Scottsdale Arabian Pleasure Saddle Seat`, url: `https://www.youtube.com/watch?v=6nSjYG3B_XQ` }, { text: `USEF Saddle Seat World Cup Team`, url: `https://www.youtube.com/watch?v=bL62Hp0Pldc` }, { text: `2012 WCHS Amateur Gentleman’s Fine Harness`, url: `https://www.youtube.com/watch?v=3JFYj4Re5CE` }, { text: `Saddle Seat vs Big Lick - NOT the same!`, url: `https://www.youtube.com/watch?v=ZfjwpgzdLJU` }],
  },
  {
    category: "English Sports",
    name: `Show Jumping`,
    the_sport: `One of the most common sports, show jumping is a test of athletic ability, strength, and agility. The goal is to complete a set number of jumps in a round without knocking down a pole in the fastest time. Sometimes set in 2 rounds. The first round being a qualifying round where you must run clear, and the second round being a speed round, or how fast you can make it around the course.`,
    key_terms: `Qualifying round - The round that decides if you go to the jump off
Jump off - Speed round. The fastest rider wins this.
Types of jumps:
Vertical - A jump with no bar behind it
Oxer - A vertical with a bar behind it
Triple Bar - A set of three bars spread out to jump over
Water jump - A jump filled with water
Liverpool - A vertical or oxer with a pool of water beneath, in front, or behind it
Crossrail - A jump that looks like an X
Wall - Soft bricks in a vertical pattern made to look like a brick wall
Plank - A narrow piece of wood/plank instead of a bar
Fault - A point
Time limit - The time in which you must beat in a course
Combination/line - Multiple jumps in a row
Efforts - The amount of total jumps in the course`,
    judging: `Each course has a time limit. Under the time limit is good, but over the time limit will earn you faults. Each fault being 1 point every 1-3 (based on the competition) seconds over the time limit. For example: time limit = 30 seconds. At 30 seconds you receive 1 time fault. Then at 33, 36, and 39 seconds you receive 1 extra time fault.

Each bar knocked down is worth 4 faults. Each refusal is 4 points. If you make it to three refusals, you are eliminated.

In order to make it in a qualifying round, each rider must make the time and have a clear round, meaning no faults. There is no jump off if every rider has a fault.

Falling off is an automatic elimination.`,
    attire: `Rider Helmet, show jacket, blazer, breeches, english boots, occasionally spurs Horse Jumping saddle, saddle pad, english bridle, martingale, tendon boots, bell boots`,
    extra_links: [{ text: `Show Jumping Overview`, url: `https://www.farmhousetack.com/blogs/barn-blog/a-guide-to-show-jumping-for-beginner-equestrians?srsltid=AfmBOopQh7Lgnexy5d6wcNZsdfW_jbCeSRY7FUsCNpE7c9TEtII3gAzC` }],
  },
  {
    category: "English Sports",
    name: `Side Saddle`,
    the_sport: `Ridden astride instead of legs on both sides. Found in both english, jumping, racing and western, though is mainly seen with an english saddle. Riders still sit up right. The right leg is looped over the top pommel and the left is placed in a stirrup. This type of riding was brought about for women to ride “modestly.”`,
    key_terms: `Crupper: a strap buckled to the back of the saddle and looped under the horse’s tail to keep the saddle from slipping forward or popping up the back.
Breast plate/breastcollar: a strap buckled to the sides of the saddle and sometimes between the breast of the horse to prevent the saddle from slipping backward.
Pommel: What the legs wrap around and are supported on on the saddle`,
    judging: `Mostly based on the type of discipline riding. Jumpers will run on jumping rules just as racing will be scored on speed. For English, judging is based on norms found in the hunting field. Usually ridden “Park” style as seen in Saddle Seat.

In western, it is similar to English but based on western equipment.`,
    attire: `Horse: sidesaddle, bridle, saddlepad, breastcollar, crupper
Rider: Top hat, riding habit, crop, spur, breeches, apron or jacket, vest, shirt, choker or tie, gloves, and boots`,
    extra_links: [{ text: `More History`, url: `https://americansidesaddleassociation.com/a-brief-history/` }, { text: `More Information`, url: `https://www.sidesaddleassociation.co.uk/introsidesaddle.asp` }, { text: `Side Saddle Race`, url: `https://www.youtube.com/watch?v=ugRsMjgb5wA` }],
  },
  {
    category: "English Sports",
    name: `Team Chase`,
    the_sport: `A British cross-country sport based on teamwork. The teams consist of 4 riders, usually racing across a course with about 25 jumps spread over ~2 miles of track. The courses are made up of natural obstacles that do not fall when knocked into like hedges, fences, fallen trees etc. Teams set off at an interval in a race against the clock; there are both “speed-based” classes of Team Chasing, as well as “optimum-time” classes. The aim of the sport is to encourage sportsmanship and enjoy a challenge with a team of friends.`,
    key_terms: `Team Captain: The organizer of a given team.
Thruster: The rider that leads the team; runs first in line.
Bogey time classes: Optimum time classes.
Flag Start: The starting line, signaled by a flag. “One Fall and Out”: Riders may not remount if they have fallen off of their horse.
The Pen: The course.`,
    judging: `Time starts once the first rider crosses the starting line, time ends once the third rider crosses the finish line. Only the time of the 1st to 3rd riders count.

Speed Class: The team with the fastest time wins.

Bogey Time Class: The team with a time closest to the optimal time wins.

Disqualification: A rider will be eliminated if a fall occurs due to safety reasons. Additionally, three refusals at the same fence can lead to an elimination, and five refusals over the whole course will lead to an elimination as well. If a rider is disqualified, but they had no effect on team time an additional 20 seconds will be added, but the team time will stand. If the rider is found to have had an effect on team time, the whole team’s time will be discounted.

Penalties: Penalties may be added to the overall time for rule violations. A 20 second penalty is to be added if the first three horses entering the pen do not have twelve hooves on the floor before anyone jumps out. Bogey Class – Maximum Time: If at least three members have not finished the course within 150% of the optimum time, the team is to be eliminated and must leave the course.`,
    attire: `A helmet and body protector are a must. Rider and Horse equipment should be kept English, however team colors are allowed and encouraged.`,
    extra_links: [],
  },
  {
    category: "English Sports",
    name: `Working Equitation`,
    the_sport: `Working Equitation (WE) is a sport that originated in southern Europe, designed to showcase and preserve historic riding traditions and to demonstrate a strong partnership between horse and rider. It is made up of multiple phases/trials: Dressage, Ease of Handling (EOH), Speed, and Cattle.

The sport consists of seven levels, starting at Level 1 (Introductory, walk/trot only) and ending at Level 7 (Masters, obstacles must be cantered and flying lead changes are required). Levels 6 & 7 must be ridden one-handed. While any horse breed may compete, the most popular for the sport are Iberian & Baroque breeds, with Lusitanos and PREs often excelling.

In the Dressage phase, competitors will ride a Dressage Test for their designated level. During the Ease of Handling trial, riders will navigate an obstacle course consisting of different types of obstacles such as gates, slaloms, jumps, bridges, and spearing a ring off of a (fake) bull. The Speed trial is the completion of an obstacle course as quickly as possible. Cattle trials are optional and are less common at WE shows, but consist of a team of 3-4 riders working together to separate specific cows from the herd and move them into a holding pen. Only in Levels 2 and above may riders compete in the Speed and Cattle trials.`,
    key_terms: `Garrocha - A pole usually between 8-14 feet long used for the Spear Ring obstacle in EOH/Speed and used for herding in the Cattle trial. Garrochas are traditionally made of wood, but other materials such as PVC may also be used.`,
    judging: `The Dressage phase scores each movement on a 10 point scale, with the judge looking for accuracy, flexibility, and balance. Ease of Handling is also scored on a 10 point scale, evaluating each obstacle, quality of movements, and a rider’s navigation of the course. The Speed phase is scored on how quickly a competitor completes the course, with time penalties for incorrect completion of obstacles. A -10 seconds bonus can be acquired if a rider can successfully spear the ring from the bull and deposit it in the barrel. Cattle trials are also scored by speed, with time penalties for errors.`,
    attire: `Competitors may ride in whichever tack style & attire they prefer (Dressage, Western, Traditional, etc), but cannot mix styles (e.g Western saddle & English bridle). At international levels, attire reflects the cultural traditions of a rider’s country.`,
    extra_links: [{ text: `USAWE Dressage Tests`, url: `https://usawe.org/wp-content/uploads/2026/03/2026-Appendix-A-Dressage-v9.1-February-26.pdf` }, { text: `Obstacles Overview`, url: `https://usawe.org/wp-content/uploads/2026/03/2026-Appendix-B-Obstacles-v9.1-February-26.pdf` }, { text: `World Championship Speed Trial`, url: `https://www.youtube.com/watch?v=e9QSmhZQZXM` }],
  },
  {
    category: "Western Sports",
    name: `Barrel Racing`,
    the_sport: `Barrel racing is a timed rodeo event where a horse and rider race in a cloverleaf pattern around three barrels placed in a triangular formation in the arena. The rider must circle each barrel tightly and return to the start line as quickly as possible without knocking over a barrel. Speed, precise turns, and strong communication between horse and rider are essential, as even a small mistake can add time penalties.`,
    key_terms: `Pattern – The cloverleaf course around the three barrels that the rider must follow.

Pocket – The space between the horse and the barrel when setting up for a turn; hitting the pocket correctly allows for a smooth, tight turn. Drive – The acceleration out of the barrel toward the next barrel or home.

Blowing Past a Barrel – When a horse runs too far past the barrel before turning, causing a wide turn.`,
    judging: `Knocked Barrel – When a barrel is tipped over during the run; usually results in a 5-second penalty.

Off Pattern – Missing the correct order or direction of barrels.

No Time (NT) – A run that does not receive a time, usually because the rider goes off pattern.`,
    attire: `Jeans, long sleeve western shirt, and western boots. Flashy belts, spurs, and cowboy hats are recommended to give your outfit more spice.`,
    extra_links: [],
  },
  {
    category: "Western Sports",
    name: `Breakaway Roping`,
    the_sport: `Breakaway roping is an equine sport founded in North America in which a person on horseback ropes a calf around the neck and their rope then “breaksaway” from the saddle letting the calf go. A calf is loaded into a chute and rider gives the signal when they are ready for the calf to be released. The calf exiting the chute will then open the riders gate once far enough away.`,
    key_terms: `Calf - a young cow
Roping Chute - where the calf waits till released
Barrier - typically a string or gate in front of the rider that opens or drops when they can start to chase/rope the calf`,
    judging: `This is a timed event based on how fast the roper can rope the calf. However, penalties can be given if the rider breaks the barrier too soon. In real life there are also penalties if you rope anything but the calf’s neck. In RedM it is typically judged on time. Again a penalty can be given to the rider if they start before told. You can also give penalties for every missed rope. Suggest using pronghorns instead of calves as they are a little too slow.`,
    attire: `Any Western Attire`,
    extra_links: [{ text: `BEST Breakaway Roping Runs of 2025 `, url: `https://www.youtube.com/watch?v=4SUB-1hK5Lo` }],
  },
  {
    category: "Western Sports",
    name: `Bronc Riding`,
    the_sport: `Bronc riding is a premier rodeo event where a rider attempts to stay mounted for eight seconds on a bucking horse, aiming for high scores based on control, rhythm, and spurring technique. There are two types of bronc riding: saddled and bareback.`,
    key_terms: `Bronc Rein - The rope attached to the horses halter that the rider holds
Bucking Chute - the chute in which the horse and rider start in until released
Covering - successfully staying on the bucking horse for a full 8 seconds
Reride - when a rider is awarded a second chance for faulty equipment or horse issues (horse didn’t buck well, injury, etc.)`,
    judging: `Typically judged out of 100 points. First, can you stay on for 8 seconds. Then everything else comes after. For full rules you can check here > Rules - Professional Bronc Riders Association . Since this is a complicated sport to do in RedM the best way to do so has yet to be found, so there are three ways this has been hosted so far. Option 1, have each rider taking turns of making their horse go wild and see who bucks the longest and they win. Option 2, roll a d20 dice for each rider and assign those numbers to correspond with a second. Rag them at the second. Option 2 really only doable if you an admin. Option 3 is to go out in the wild and basically see who can stay on a wild horse the fastest or tame the fastest.`,
    attire: `Western Attire but chaps, spurs, and protection vest are required.`,
    extra_links: [{ text: `Saddle Bronc Riding - 2023 ABC Pro Rodeo`, url: `https://www.youtube.com/watch?v=upAAfSYhUDA` }],
  },
  {
    category: "Western Sports",
    name: `Cutting`,
    the_sport: `Cattle Cutting is rooted in traditional working ranch practices of the American West, where a horse and rider separate (or “cut”) a single cow or steer from the herd and prevent it from returning in order to be able to perform tasks such as veterinary care, tagging, branding, or sorting.

Ranchers relied on horses that were “cowy” or possessed strong “cow sense,” an often inherited instinct & talent for the work. This includes intense focus, quick reflexes, athleticism, and the ability to lower their body and move with precision (launching quickly, stopping & turning precisely) to anticipate and mirror the cow’s movements, along with the confidence & calmness to work in close proximity with livestock.
Modern-day cutting has developed into a highly technical competitive discipline with events held internationally. Within the competition, horse & rider are given a 2.5 minute run, during which they must cut & work at least TWO cows, one of which must be taken from the center of the herd (called a “deep cut”) rather than the outskirts of the herd. The run begins with the rider approaching the herd, typically 40-50 head, with minimal disturbance to the herd.

The rider then selects a cow to “cut” or separate from the herd, bringing it to the center of the arena. At this point, the rider lowers their hand and works on a loose rein, which signals for the horse to take initiative in controlling the cow. The horse works with a high degree of independence, using its natural cow sense to anticipate the cow’s movements while the rider provides only subtle cues / guidance. The entire 2.5 minute performance is judged as a whole on a points-based system, starting from a base score of 70 points with points added or subtracted based on the run and factors including herd work, degree of difficulty, control, and overall performance. The rider may choose to work additional cows if the remaining time allows to demonstrate consistency & potentially earn more points for the run overall.`,
    key_terms: `Cutting - separating a single cow from the herd
Run - a 2.5-minute session in which a horse and rider separate or “cut” and work multiple cows from the herd, judged as a singular performance
Deep Cut - selecting a cow from the center / middle of the herd rather than on the outskirts of the herd
Herd Work - the portion of the run in which horse and rider calmly work into the herd to select a cow without upsetting or disturbing the others
Working the Cow - once a cow is separated from the herd, it is controlled by the horse & rider and prevented from returning to the herd
Committing - a moment the rider clearly shows that they’ve chosen a cow to work, indicated by dropping their rein hand, allowing the horse to take initiative over controlling & working the cow
Degree of Difficulty - one element horse and rider are judged on during their performance which is determined by the amount of effort exerted by the cow in its attempt to return to the herd. A horse that is able to successfully work a cow that moves quickly, rapidly, and is difficult to anticipate will result in more credit from the judge.
Under Control - a cow is considered under control when the horse is dictating the cow’s movements and maintaining position, preventing the cow from escaping
Quit - when the rider decides to leave a cow to return to the herd and select another, initiated by picking up their rein hand and/or taking their free hand off of the saddle horn
Good Quit - a prime time for the rider to leave the cow which is centered in the arena, when the horse has shown clear control, and the cow is not actively escaping, and the sequence seems polished & complete
Hot Quit - when a rider prematurely quits a cow before it is under control, or attempting to move around the horse to get back to the herd
Cowy/Cow Sense - a horse’s natural instinct to anticipate and react to a cow’s movement
Turnback Rider - riders who are there to assist the cutter, positioned at the back of the arena to keep the cow from escaping past the designated working area
Herd Holder - riders who keep the herd grouped together while the cutter works
Back Fence - the rear boundary of the arena; if the cow is allowed to reach the back fence, penalties may be incurred`,
    judging: `Upon the signal of the judge to begin the run, the horse & rider’s 2.5 minute timer starts. The run is judged as a whole using a point-based system, with each rider starting with a base score of 70. Points are added or deducted depending on how the horse and rider handle the run.

Factors that can positively impact a rider’s score include aspects such as herd work, cow control, degree of difficulty, style, and courage. Point deductions (commonly one, three, or five points depending on severity) may be incurred for faults such as failure to make a deep cut, disturbing the herd, excessive rider assistance, improperly quitting a cow, failure to separate a single cow, a horse turning its tail to the cow, a rider falling or dismounting from the horse, and the rider placing a second hand on the reins.`,
    attire: `Cutting competitions entail Western traditions, and therefore participants’ attire often reflects a traditional Western style with long-sleeved button-up shirts, jeans, heeled cowboy boots, and a cowboy hat. Higher level cutting competitions may require a stricter, more specific dress code.`,
    extra_links: [{ text: `National Cutting Horse Association Rulebook’`, url: `https://nchacutting.com/docs/default-source/miscellaneous-forms/rule_book.pdf` }, { text: `What is a Cutting Horse Competition? NCHA Explains`, url: `https://www.youtube.com/watch?v=hUI7fnEWPUo&t=55s` }, { text: `US Cutting Horse Association Rulebook`, url: `https://unitedstatescutting.com/forms/USCHA%20Rulebook%202026%20New%20Rulebook.pdf` }, { text: `Houston Rodeo Professional Cutting Horse Competition`, url: `https://www.youtube.com/watch?v=nCRzUjn4I7I` }, { text: `Metallic Cat - 2009 Abilene Spectacular`, url: `https://www.youtube.com/watch?v=RnEiCxwytUU` }, { text: `Gabe Reynolds & Hot Dona 2019 Congress BRIDLELESS Cutting`, url: `https://youtu.be/RBc97QkE3eI?t=80` }, { text: `A Cut Apart - Horses who Shaped the Cutting Horse Industry`, url: `https://www.youtube.com/watch?v=fuI09KN8lBs` }],
  },
  {
    category: "Western Sports",
    name: `Pole Bending`,
    the_sport: `Pole bending is a timed rodeo event where a horse and rider weave through a straight line of six evenly spaced poles. The rider begins at the start line, runs straight to the end pole, then weaves back and forth through the poles before turning around the last pole and weaving back again toward the finish line. The goal is to complete the pattern as quickly and smoothly as possible without knocking over any poles, as penalties are added for each pole that falls. The event tests a horse’s speed, agility, and responsiveness, along with the rider’s ability to guide precise turns.`,
    key_terms: `Pattern – The course consisting of six poles placed in a straight line.

Weave – The side-to-side motion of the horse and rider as they maneuver through the poles.`,
    judging: `Knocked Pole – When a pole is tipped or knocked down; usually results in a 5-second penalty.

No Time (NT) – Given when the rider goes off pattern or fails to complete the course correctly.

Off Pattern – Missing a pole, weaving incorrectly, or failing to complete the proper route.`,
    attire: `Jeans, long sleeve western shirt, and western boots. Flashy belts, spurs, and cowboy hats are recommended to give your outfit more spice.`,
    extra_links: [],
  },
  {
    category: "Western Sports",
    name: `Ranch Sorting`,
    the_sport: `The objective is to be able to sort 10 numbered cattle and one unnumbered cow within the 60 seconds typically given. It's a two rider competition that tests not only horsemanship but teamwork and strategy to move cattle without penalties. In the arena, there are two connected 50-60ft round pens with a 13ft opening. Riders will begin in the pen without any cows, an announcer will call out a number and the riders must move that cow, followed by the additional cows in order. Example: The announcer calls out 5, the riders move cow #5 then proceed with cows 6,7,8,9,0,1, etc.`,
    key_terms: `Sorting Pen - Where cattle are moved into
Holding Pen - Starting pen containing the herd
Gate Line - Imaginary line between the two bens where cattle cross
Cutting a Cow - Separating one cow from the herd
Blocking - Where the second rider prevents incorrect cattle from crossing the line
Herd Holder - The rider that isolates, cuts and drives the correct cow to the gate
Gate Person - The rider guarding the opening, preventing wrong cattle from passing
The Number - Random number announced to start the run
The Gate/Opening - 12-16ft opening between the two round pens
Dirty Cattle - The unnumbered cow(s) that must remain in the starting pen No Time (NT) - A disqualification when a cow is moved out of sequence, a "dirty" cow crosses the line, or a cow crosses back to the original pen`,
    judging: `They are evaluated based on accuracy and speed while they sort the cattle in a strict numerical order from one pen to the other within 60-80 seconds. Basically the team who sorts the fastest wins but there are criteria that will lead to a disqualification. For example, if a cow crosses the line out of order or crosses back the foul line or 'The Gate/Opening', it will be a "No Time". These are not the only criteria that qualify for a disqualification, some include excessive force, rough treatment of livestock, or whipping in front of the cinch. Points are usually given based on the number of teams entered, typically one point per five teams.`,
    attire: `Shirt: Long sleeve button up
Pants: Appropriate Jeans
Hat: Western or cowboy hat
Shoes: Western/cowboy boots
Accessories: Belt

Saddle: Western saddle
Blanket/Saddle Pad: Western saddle pad
Bridle: Lightweight western bridle
Additional: Breast Collar`,
    extra_links: [{ text: `Ranch Sorting Tips`, url: `https://horseandrider.com/western-horse-training-tips/ranch-sorting/mastering-the-art-of-working-the-gate-with-logan-wolfe/` }, { text: `General Rules & Disqualification`, url: `https://extension.arizona.edu/sites/extension.arizona.edu/files/attachment/RanchSortingRulesOnly.pdf` }, { text: `IRL Comp Example`, url: `https://www.youtube.com/watch?v=mIdLmJKEFVM` }],
  },
  {
    category: "Western Sports",
    name: `Reining`,
    the_sport: `Showcases a horse's athleticism, responsiveness, and precision through a pre-set pattern, these traits are necessary for a working cattle ranch horse. The horse should be willing to be guided with little or no resistance through a number of maneuvers like stops, spins, rollbacks, and lead changes. They are guided through one of 18 possible patterns as they present powerful moves in a specific order.`,
    key_terms: `Sliding Stop - Straight stop from speed where the horse slides on its hind legs while front legs remain forward
Rollback - A 180 turn immediately following a stop then returning to speed in the opposite direction
Lead Change - Changing leads at a lope without breaking gait
Circles - Performed at a lope, showcasing controlled changes in speed and size
Rundown - Running at speed along the side of the arena, often required before stopping
Back - A quick reverse movement of at least 10 feet`,
    judging: `Every rider comes in with a score of 70 which also indicates you had an average performance at the end. Each maneuver may receive a -1.5 for extremely poor quality to +1.5 for excellent quality (-1 very poor, -0.5 poor, 0 average, +0.5 good, +1 very good) Increased difficulty can add points while inaccuracy can take away points. No points are given OR taken away if the maneuver is performed correctly with no additional difficulty. Speed isn't what can get you the win, the best reined horse should be controlled with little resistance. Credit will be given for smoothness and precision while maintaining a controlled speed.`,
    attire: `Shirt: Long sleeve button up
Pants: Dark fitted jeans, chaps are recommended
Hat: Western or cowboy hat
Shoes: Western/cowboy boots
Accessories: Belt with a stylish buckle

Saddle: Reining saddle, provides close contact with the horse
Blanket/Saddle Pad: Western saddle pad
Bridle: Curb bits, usually one ear headstall
Additional: Leg protection`,
    extra_links: [{ text: `Reining Patterns`, url: `https://www.aqha.com/reining1` }, { text: `Reining Patterns Pt 2`, url: `https://nrha.com/wp-content/uploads/2026/01/patterns.pdf` }, { text: `Scoring Info`, url: `https://nrha.com/wp-content/uploads/2026/02/rulesforjudging.pdf` }, { text: `Example Scoring Sheet`, url: `https://nrha.com/wp-content/uploads/2026/02/judgingdiagrams.pdf` }, { text: `MORE Scoring Info`, url: `https://www.canr.msu.edu/news/how_do_you_judge_reining#:~:text=Reining%20is%20a%20scored%20class,functional%20correctness,%20maneuvers%20and%20attitude.` }, { text: `Saddle Comparison`, url: `https://www.youtube.com/shorts/8DhqzcnXkd4` }, { text: `Reining 101`, url: `https://www.youtube.com/watch?v=EBO0PvZZTcY` }, { text: `IRL Comp Example`, url: `https://www.youtube.com/watch?v=6_rNYGGGfOY` }],
  },
  {
    category: "Western Sports",
    name: `Team Penning`,
    the_sport: `The goal is to be able to separate three specific cattle that are numbered 0-9 from a herd of 30, then move them into a pen at the far end of the arena as quickly as possible. This is done with a team of three riders that must cut the specific cattle out from a herd and put in a small 16' x 24' pen within the 60-90 seconds given. Much like Ranch Sorting, this sport tests horsemanship, teamwork, speed, and cattle handling, all traits for successful ranch work`,
    key_terms: `Hole Man (Hole Setter) - This rider positions themselves in the gap between the arena wall and the pen to help guide cattle in and prevent them from bypassing it Wing Man (Wing) - This rider stand to the side of the pen, creating a "wing" or funned to direct the cattle into the pen Sweep (First Man) - This rider is farthest from the pen and controls the herd, cutting out the numbered cows and driving them toward the pen
Cutting a Cow - Separating one cow from the herd No Time (NT) - A disqualification due to a rule violation
Turnback - Redirecting a cow that attempts to escape back to the herd`,
    judging: `Largely based on the fastest time while monitoring for penalties such as crossing with the incorrect cattle and excessive "roughing of cattle, these often result in immediate disqualification. Placing will depend on both time and amount of cattle in the pen, for example a team with fewer cattle will always rank behind a team that pens more. There are two timekeepers, the first timer will be the official time and the second is a back up in the event that the first timer misses the time. A rider will call time, they must stand at the opening of the gate and raise a hand for the flag. The flag will be dropped once the nose of the first horse enters the gate.`,
    attire: `Shirt: Long sleeve button up
Pants: Appropriate Jeans
Hat: Western or cowboy hat
Shoes: Western/cowboy boots
Accessories: Chaps

Saddle: Western saddle, often with a high cantle
Blanket/Saddle Pad: Western saddle pad
Bridle: Curb bits or snaffle are common
Additional: Breast Collar, Protective Boots`,
    extra_links: [{ text: `Brief Overview & Small Video`, url: `https://www.teampenningmb.com/what-is-team-penning` }, { text: `Hour Long Clinic`, url: `https://www.youtube.com/watch?v=uSegNtlWUyw` }, { text: `IRL Comp Example`, url: `https://www.youtube.com/watch?v=ABA6r6OKXq0` }],
  },
  {
    category: "Western Sports",
    name: `Team Roping`,
    the_sport: `A fast paced rodeo sport where two people (a header and a heeler) work together to rope a calf for the fastest time. The header ropes the calf’s head and the heeler ropes it’s heels.`,
    key_terms: `Header - The one who ropes the calf’s head
Heeler - The one who ropes the calf’s heels/hind legs
Calf - a young cow
Roping Chute - where the calf waits till released
Barrier - typically a string or gate in front of the rider that opens or drops when they can start to chase/rope the calf`,
    judging: `This sport is judged on time. However if a barrier is broken, penalties can be given. Time stops when both riders have their lassos secured around the calf. We can’t lasso like this in RedM, so a team does it but both must lasso the head of the pronghorn (bc cows are too slow). In RedM disqualification is normally given if riders crash into each other.`,
    attire: `Any Western Attire`,
    extra_links: [{ text: `The Replay: 2023 Team Roping World Champions`, url: `https://www.youtube.com/watch?v=0eIVe4lNcaA` }],
  },
  {
    category: "Western Sports",
    name: `Tie Down Roping`,
    the_sport: `Tie Down roping is a fast paced rodeo event in which a rider ropes a calf and then dismounts their horse and lays the calf on the ground and ties three of their legs together. The calf must remain tied for 6 seconds.`,
    key_terms: `Calf - a young cow
Roping Chute - where the calf waits till released
Barrier - typically a string or gate in front of the rider that opens or drops when they can start to chase/rope the calf`,
    judging: `Competitors are judged on time but there are also penalties before breaking the barrier early and disqualifications if the calf unties itself in under 6 seconds. We can’t tie down calfs in RedM but we can humans…so this sport is best done if the competitors chases a human on horseback, lassoes them off, and then dismounts their horse to hogtie them.`,
    attire: `Any Western Attire`,
    extra_links: [{ text: `The FASTEST Tie Down Roping Runs You’ll See All Year `, url: `https://www.youtube.com/watch?v=F6-z6GcJT3s` }],
  },
  {
    category: "Western Sports",
    name: `Western Dressage`,
    the_sport: `Western Dressage combines the foundational principles of Dressage with Western-style stock horse riding. The main goal of the sport is similar to dressage, to develop a horse that is balanced & able to carry the weight of a rider in a biomechanically healthy way by engaging the hindquarters/topline in a western riding frame, while performing prescribed tests or freestyle routines made up of figures/patterns/movements in a standard 20x40m or 20x60m dressage ring.`,
    key_terms: `(For more foundational dressage terms, see dressage)
Jog - a 2-beat gait + legs move in diagonal pairs, similar to a trot but typically slower & more relaxed with a less pronounced moment of suspension in Western riding.
Free Jog or Free Walk - the horse is allowed to stretch forward & down while maintaining the jog or walk rhythm
Lope - a three-beat gait with a moment of suspension where one front leg reaches farther forward, creating the leading leg
Lengthen Gait - increase the length of stride & ground cover within the same gait
Counter-lope - a lope performed on the opposite lead from the direction of travel or bend, for example traveling left while on the right lead
Pivot/Half-Pivot - the horse turns around the inside hind leg while the front legs cross over and the outside hind steps around it. The pivot foot may lift slightly & reset. A half-pivot is a 180-degree turn
Double Pivot - a 720-degree pivot turn performed with no forward movement
Turn on the Forehand - performed from a halt or walk, where the hindquarters move around the forehand while the hind legs step and cross.
Leg Yield - the horse moves forward and sideways while keeping its body relatively straight, different from a halfpass in which the body has bend. Helpful diagram
Sidepass - a lateral movement sideways with no forward movement where the front legs and hind legs cross to move directly sideways.
Lope Pirouette - a 360-degree turn performed at the lope with the forehand moving around the haunches. Haunches are lowered with a lifted/light front end
Quarter-Pirouette - a 90-degree turn, ¼ of a circle
Half-Pirouette - a 180-degree turn, ½ of a circle Halt & Back/Rein-Back - a series of backward steps in diagonal pairs before immediately moving forward into the required gait. Steps are counted by each foreleg stepping back Backward & Forward Steps Series - a specified number of clear rein-back steps, followed by immediately moving forward by a set number of steps, and finally backward again for a set number of steps before immediately moving forward into the next required gait`,
    judging: `Similar to standard Dressage, Western Dressage is judged using a numerical scoring system for each individual movement, judges evaluate the correctness & harmony of horse and rider as well as accuracy of execution of the required movements with final scores expressed as a percentage of the total possible points. Each movement can receive up to 10 points: 10 (Excellent), 9 (Very good), 8 (Good), 7 (Fairly Good), 6 (Satisfactory), 5 (Marginal), 4 (Insufficient), 3 (Fairly bad), 2 (Bad), 1 (Very bad), 0 (Not performed)

In traditional “tested” classes, riders perform a set of directives containing patterns & movements, and in freestyle classes, riders choreograph their own routine to music that meets the basic movement requirements of their level. While still being judged on technical correctness, freestyle judging also includes artistic scores for choreography & musical interpretation. WDAA (Western Dressage Association of America) test levels include Intro, Basic, Level 1, Level 2, Level 3, Level 4, and Level 5.`,
    attire: `RIDER ATTIRE:
• (Required): Conservative “workman-like” attire emphasizing functional, clean Western style. A suitable western hat is traditional however helmets are permitted and encouraged for safety, long-sleeved button-down collared shirt of any color (though it’s recommended to avoid bright, distracting, or neon colors), trousers/pants, Western style boots (tall English boots clearly visible on the outside of the pants are NOT permitted)
• (Optional): Necktie/kerchief/bolo tie or pin, a vest/jacket/coat, Western-style spurs, Chaps/Half-chaps

TACK
• Bridle/Saddle: Any Western-type bridle is required, English-style bridles, double noseband bridles, or rope halters are not permitted. Breastplates may be used. A standard Western stock saddle with swells, a seat, cantle, skirt, fenders, and Western stirrups is required. Side-saddle riding style is also acceptable. Australian, Baroque, English/McClellan and Spanish style saddles are not permitted.
• Saddle Pad: Functional, western-style saddle pads that are appropriate for a standard Western stock saddle; pads may be of any color (though it’s recommended to avoid bright, distracting, or neon colors). HORSES
• ALL breeds of horses, ponies & mules are welcome to compete.
• Horse manes should be clean & neat in appearance. Roached (shaved) manes are permitted, as are long/natural manes provided they are tidy. Braiding is not traditional in Western Dressage and is generally discouraged.
• Horses should be brushed clean upon entry into the dressage ring.`,
    extra_links: [{ text: `WDAA Western Dressage Glossary`, url: `https://wdaa.memberclicks.net/assets/docs/Western-Dressage-Glossary-rev2018-03-15.pdf` }, { text: `2022-2026 WDAA Test PDFs/Scoresheets`, url: `https://www.westerndressageassociation.org/wdaa-tests` }, { text: `WDAA Test Tutorial Videos`, url: `https://www.youtube.com/@equestriantestsandpatterns9220/playlists` }, { text: `“What is Western Dressage?”`, url: `https://youtu.be/GGWVuDuCdf4?t=59` }, { text: `Intro Level Test 3 Performance`, url: `https://www.youtube.com/watch?v=KpYoZTPK8Hk` }, { text: `Intro Level Test 3 Performance`, url: `https://www.youtube.com/watch?v=si7rnzFLPYg` }, { text: `Level 4 Freestyle Performance`, url: `https://www.youtube.com/watch?v=uM-69pN0b7A` }],
  },
  {
    category: "Western Sports",
    name: `Western Pleasure`,
    the_sport: `The overall goal is to display the idea that the horse should be a "pleasure" to ride, moving willingly with smooth, relaxed movements, and no resistance. They evaluate the horse's manners, movement, and responsiveness while showcasing a controlled walk, job, and lope on a loose rein. Competitors are required to perform a walk, a jog (sometimes an extended jog as well), and a lope in both directions of the arena. The horse's ideal posture will show the head and neck in a relaxed position, typically level or slightly above the withers.`,
    key_terms: `Jog - Slow and smooth two beat trot
Extended Jog/Lope - Slightly faster & lengthen stride while maintaining balance, comfort, and control
Lope - A three beat canter with controlled stride length while keeping correct lead
Reversal - Change of direction, performed at the rail
Rail Work - Initial phase where horses are judged while riding around the perimeter of the arena
Quarter Line - Area inside the main rail, used to cleanly pass other horses in a smooth and consistent performance
Cadence - Consistent rhythm at any gait
Frame - Outline of the horses head and neck position
Topline - The position of the head and neck, level or slightly above with the withers
Behind the Vertical - Where the horses nose is too close to its chest
Collection - Engaged hindquarters with controlled stride
Break of Gait - Incorrect transition of gait`,
    judging: `There are four major criteria for judging which include Broke and Quiet, Soft and Smooth, Functionally Correct, Consistency and Quality. In addition to these criteria there are also many ways the judges will evaluate your horse such as Quality of Movement, Attitude/Temperament, Gait Accuracy. You want a calm and responsive horse while they maintain quality and correct gait cadence. These criteria are scored on a 0-100 scale, with 70 being average. Minor faults such as a break of gait will deduct 3 points while a major fault like failure to take the correct gait will lead to a deduction of 5 points. Point increments can vary from +/- ½, 1, 3, 5 to reflect the quality of the evaluated gait.`,
    attire: `Usually focused on coordinated looks and making you and your horse look good
Shirt: Long sleeve button up, can include embroidery
Pants: Dark fitted jeans, chaps are to be tailored leather or ultrasuede
Hat: Western or cowboy hat
Shoes: Western/cowboy boots
Accessories: Belt with a stylish buckle

Saddle: Standard western saddle with or without silver, often matching the horses coat
Blanket/Saddle Pad: Coordinated and matching
Bridle: Matching leather. curb bit
Optional: Breast collars`,
    extra_links: [{ text: `Score Sheet Example`, url: `https://sub.appaloosa.com/pdfs/WesternRiding_P7.pdf?1` }, { text: `Detailed Terminology`, url: `https://www.uaex.uada.edu/farm-ranch/animals-forages/horses/western_pleasure.pdf` }, { text: `Video Breakdown/Lesson`, url: `https://www.youtube.com/watch?v=pNS2NSFZRjY` }, { text: `IRL Comp Example`, url: `https://www.youtube.com/watch?v=-RPOGqqm2wI` }],
  },
  {
    category: "Western Sports",
    name: `Western Trail / Mountain Trail`,
    the_sport: `The purpose of Western/Mountain Trail is to show off the horse’s ability and willingness to conquer obstacles similar to those one would come across when trail riding or doing ranch work, such as opening and closing gates, crossing bridges and water, and maneuvering poles. All on horseback. Every trail course will have a minimum of 6 obstacles for each of the three gaits, and often includes moves like backing up, side-passing, and turning on the spot. It’s not only about completing the course without faults, but also showing that the horse is attentive and interested in the obstacles.`,
    key_terms: `Walk - The slowest, natural gait
Jog - A slow, steady, and rhythmic trot
Lope - A slow and relaxed canter
Side Passing - The horse moves laterally, crossing its front and hind legs as it steps sideways

Mandatory Obstacles - Every Trail Course will include these:
The Gate - Opening a gate, walking through, and closing it.
Walk/Trot/Lope-Over - Riding over a set of at least 4 poles in the required gait.
Backup - The horse is backing up between poles, which can either be straight or include a backwards turn, and must not touch them.
Other Obstacles - While not all of these are found in every course, at least 3 of these will always be included:
Bridge - Crossing a wooden bridge, usually at a walk, sometimes a slow jog
Weaving - Passing through poles at a walk or jog, alternating between left and right
Side Pass - Moving sideways over or between the obstacle
Box - Stopping inside a square of poles, sometimes including a 180° or 360° turn on the spot
Jump - A short jump, mimicking obstacles such as fallen logs on a trail
Sheet - Riding over a sheet on the ground`,
    judging: `Western/Mountain Trail is not judged on time, but rather going by a point system based on the execution and performance of the course. Each obstacle is judged separately, either adding or subtracting points from the total score. Penalties may be given if a pole has been hit, stepped on, or knocked down, as well if the required gait has been broken, and if the horse refuses or is disobedient in any way. Judges also pay close attention to the horse’s willingness to work, and may add or remove points. A horse that completes the course without mistakes but seems generally uninterested may lose to a horse with the same score but more attentiveness.`,
    attire: `Rider Depending on the event, the rider’s attire will be either flashy and fancy with glitter and rhinestones, or neat and workmanlike. In both cases, the rider is expected to wear a long-sleeved button-up, jeans, and a hat, overall giving a well put-together look. Accessories like chaps and boleros are often seen in the flashier classes, and matching with the horse’s tack is always welcome.

Horse A western saddle and bridle, either in neutral or colorful depending on the event combined with a saddle pad that ideally matches the rider’s outfit. A horse that is lacking volume in its tail can wear tail-extensions. Leg wraps of any kind are not allowed.`,
    extra_links: [{ text: `A judge’s perspective of Western Trail`, url: `https://youtu.be/tYnQpa5TN1g?si=iH7ZgfPbeHt86NJv` }, { text: `What IS Ranch Trail YT short`, url: `https://www.youtube.com/shorts/s6hTcwMhuRk` }, { text: `Discipline Spotlight: Western Trail`, url: `https://issuu.com/usponyclubs/docs/discover_uspc_issue_162_summer_2021_digital/s/13320568` }, { text: `Score Sheet`, url: `https://www.aqha.com/documents/82601/0/Ranch%20Trail.pdf/8a248dae-7ade-dd85-0f9b-a968f9d990a3` }],
  },
  {
    category: "Western Sports",
    name: `Working Cow Horse`,
    the_sport: `Combines reining and cattle work. The competition consists of two parts, the reining work then the cow work. For the first half, riders will perform one of 12 available patterns which will include sliding stops, spins, circles, and lead changes. The second half is to showcase the horse's ability to control and hold a single cow, taking it to various points of the arena. The goal is to first "box" the cow then must turn the cow in each direction at least once before taking the cow to the middle and driving it in a circle both ways. These skills are also easily applicable to ranch work`,
    key_terms: `Dry Work - Reining portion of the competition
Cow Work - Second half of the comp where the horse must control the cow
Boxing - Initial part of cow work where the horse must keep the cow against the fence area
Neutral - A spin that begins when your horse is standing still and on a loose rein
Hung Up - When a horse freezes and refuses to move its shoulders
Schooling - Excessive pulling or maneuvering, which can lead to penalties
Cow Sense - Horses ability/instinct to read cattle
Turn on the Fence - Doing a quick turn with the cow when it attempts to run along the arena wall
Down the Fence - Taking the cow at high speed along the long side of the arena`,
    judging: `Each rider starts with a score of 70 when they enter, scoring can range from 60-80 so for each maneuver they perform they may receive a plus, a zero, or minus points from a judge. A score of 70 is considered the average and anything above a 70 indicates that the rider earned plus credit during the run. Penalties between 1-5 points are given when there is loss of working advantage, working out of position, horse quitting a cow early, cattle picked up (running into or scattering herd), losing a cow, and more A zero score is given when the horse turns its tail (backend faces the cow), leaving the working area before time expires, or when the horse/rider falls.`,
    attire: `Functionality in both clothing attire and tack are things taken very seriously by judges
Shirt: Long sleeve button up
Pants: Jeans with the occasional fringed or smooth leather chaps
Hat: Western or cowboy hat
Shoes: Western/cowboy boots
Accessories: Scarf/Neck tie aka "wild rag" is common during colder months but also fashionable

Saddle: Traditional western saddle
Blanket: Basically anything, pick colors that compliment your horse or outfit
Bridle: Traditional hackamore or western-styled with curb bit`,
    extra_links: [{ text: `Reining Patterns`, url: `https://www.aqha.com/working-cow-horse1` }, { text: `IRL Comp Example`, url: `https://www.youtube.com/watch?v=2JYIw0zFxbk` }, { text: `Simple Point Sheet`, url: `https://sub.appaloosa.com/pdfs/WorkingCowHorseReferenceSheet.pdf` }, { text: `In-depth Judge Guidelines`, url: `https://issuu.com/thenrcha/docs/2026_nrcha_rulebook/70` }, { text: `Equipment Acceptance`, url: `https://issuu.com/thenrcha/docs/2026_nrcha_rulebook/30` }],
  },
  {
    category: "Racing",
    name: `Endurance Racing`,
    the_sport: `In Endurance Racing, rider and horse are timed as they cover long distances, while also making sure that the horse is in optimal condition throughout the entire event. Races can range between 20 and 160 kilometers, and may include various terrains like mountain paths and forest trails. The key is stamina management and strategy, rather than pure speed, the horse’s health always comes first. For races up to 80km, riders have to keep an average speed of 12-19km/h, races longer than that are ridden at the rider’s own pace.`,
    key_terms: `BC (The Best Conditioned) - An award that is generally more prized than finishing first. It is determined by speed, weight carried, and the veterinary scores throughout the checkpoints. A horse does not need to get first place in the race to win this award.
Checkpoint/vet gate - Placed throughout every race for the mandatory vet checks, and for the horses to have a quick drinking break.`,
    judging: `There are mandatory checkpoints throughout a race, where veterinarians check the horse’s overall condition, and only a healthy horse is allowed to continue. By the rules of FEI and AERC (American Endurance Racing Conference), the first horse to cross the finish line and pass the final vet check, is the winner. Often, additional awards are given to horses although they did not finish first.`,
    attire: `Horse The tack for Endurance Racing is lightweight due to being made of synthetic material such as Biothane for the bridle, and carbon fiber for the saddle. It’s waterproof, easy to clean, and comes in all sorts of colors, hence why very bright tack is commonly seen. Breastcollars and protective boots are often used as well.

Rider At FEI competitions, riders must wear a riding helmet, breeches, correct footwear, and a collared shirt. Jackets and coats are of course recommended depending on the weather.

Prohibited Equipment Draw reins, whips, spurs, ear plugs, and ear bonnets are not allowed to be used in Endurance Racing`,
    extra_links: [{ text: `What is Endurance Riding, AERC`, url: `https://aerc.org/what-is-endurance-riding/` }, { text: `The Rules of Endurance, FEI (Video)`, url: `https://www.youtube.com/watch?v=iT-qX6AvVeM` }, { text: `Vet Check (Video)`, url: `https://www.youtube.com/watch?v=l6hhqJpTJXc&t=1s` }],
  },
  {
    category: "Racing",
    name: `Flat Racing`,
    the_sport: `Flat racing is a form of horse racing conducted on a level ground without any obstacles, for example “Hurdles” or “Fences”, testing a horse’s speed, stamina and acceleration.
These races are often held on turf or all-weather synthetic surfaces over distances ranging from five furlongs (about 1,000 metres) or over two miles (about 3,218 metres).`,
    key_terms: `Group/Pattern races: this is the highest level of racing (Group 1,2 or 3) where the best horses often compete at level weights.
Classic races: these are often noted as the triple crown in America (The Kentucky Derby, Preakness Stakes and Belmont stakes) or triple tiara in Japan (Oka Sho, Yushun Himba and Shuka Sho)
Handicap: A race where horses carry different weights based on their official rating to equalize their chances of winning.
Maiden: A race for colts or fillies that have not yet run a race.
Listed Race: A contest just below Group level in quality Bumper (NH Flat Race): A race run under jump rules but without obstacles, often used for young horses to gain experience.
Sprint: Are usually races run over short distances usually 5 or 6 furlongs.
Stayer: These are horses that specialise in long distance races, generally two miles or more.
Furlong: A unit distance equal to ⅛ of a mile or 220 yards.
Going: This is usually the condition of the ground (e.g firm, good, soft or heavy).
Draw: This is the allocated starting stall position for a horse.
Stands side: The side of the track closest to the grandstand.
Starting stalls/Gate: Machines usually used to maintain a fair start, sometimes these can lead to false starts.
False starts: A false start often occurs when the starter would deem the start unfair, often due to horses breaking through starting stalls prematurely, jockey disobedience, horses rearing in stalls, etc.
Dead heat: When two or more horses cross the finish line at the same time. Stewards’ enquiry: An investigation by officials into potential rule infractions during a race.
Weighed in: The official announcement that the race results are confirmed after the jockeys have been weighed.
On the bridle: A horse running comfortably, holding the bit.
Off the bridle: A horse being pushed by the jockey and losing contact with the bit, usually a symptom of tiredness.
Turn of foot: A horse’s ability to accelerate quickly.`,
    judging: `Flat racing is judged primarily by a finish line judge who determines the order of finish, often aided by technology for close calls, while handicappers evaluate performance to assign ratings, and stewards ensure compliance with the rules. (However in the rift’s case a photo of racers crossing the finish line can often be used to mimic the technology in real life for helping with close calls.)`,
    attire: `Attire for flat racing usually consists of: Silks (Racing colours): these can often be made up of a wide variety of colours and can incorporate various shapes into their design, However in the rift mixing shirts and vests with different colours can mimic this
Helmet: A helmet is very much mandatory, you can either spooner a helmet in or use a flat cap (this one you can colour to match with your silks)
Goggles: Worn over the eyes to protect against mud, debris, and wind, you can look in the glasses section of the tailor and find similar to mimic real goggles.
Boots: black english leather boots are preferred.
Gloves: you can either use black gloves or none, but realistically these would be used to keep a better grip on the reins.
Breeches: White breeches are a must.
For the horse: English bridle or nosebandless. English saddle Any colour of saddlepad (valentine or collectors work best)`,
    extra_links: [{ text: `Flat racing: Explained`, url: `https://www.youtube.com/watch?v=doOAClUcqH4` }, { text: `Kentucky Derby 2022 (FULL RACE) | NBC Sports`, url: `https://www.youtube.com/watch?v=wIYD42DV3Ro` }, { text: `2025 TOKYO YUSHUN (JAPANESE DERBY) (G1) | JRA Official`, url: `https://www.youtube.com/watch?v=AR9wrLDuOgg` }, { text: `Example of a dead heat`, url: `https://www.youtube.com/watch?v=xOz-A29eINA` }],
  },
  {
    category: "Racing",
    name: `Harness Racing`,
    the_sport: `Harness Racing is a type of racing where a horse (typically a Standardbred) moves at a trot or pace pulling a sulky behind them where the rider sits. Races start as a rolling start behind a motorized vehicle with wings used as a mobile barrier. When the race starts the vehicle lifts the wings and speeds off in front of the horses till it is out of the way. Horses then do the required length of the track or laps and first to the finish line wins. Pacers and Trotters almost never compete in the same race. While racing, these horses can reach 40 mph (64 kmh) at the trot/pace.`,
    key_terms: `Trotter - A horse who legs moves in diagonal pairs at the trot (right front and left hind, left front and right hind)
Pacer - A horse who trots with lateral movements (right front and right hind move together while left front and left hind more together)
Sulky - the buggy or cart that is pulled behind the horse in harness racing
Rolling Start - where horses are moving and trotting behind the start barrier vs being stationary
Driver - the person who is sitting in the sulky controlling the horse
Hopples - adjustable synthetic, leather, or plastic loops worn by pacers to maintain their unnatural, rhythmic two-beat gait by connecting their front and rear legs on the same side.`,
    judging: `This is a speed based sport. First to the finish lines wins as long as no cheating or drugs were used. Horse also must maintain the proper gait or will be disqualified`,
    attire: `Basic Racing attire`,
    extra_links: [{ text: `One of a kind | In the Cart with Rory McIlWrick | Harness Racing New Zealand`, url: `https://www.youtube.com/watch?v=O_kapA5Cdmc` }, { text: `What Is That? | Harness Gear`, url: `https://www.youtube.com/watch?v=49BzoZnzMR0` }, { text: `What Is That? Harness Racing Gear`, url: `https://www.youtube.com/watch?v=mlX6Ubn9VpQ` }, { text: `The Different Gaits in Harness Racing`, url: `https://www.youtube.com/watch?v=NIH1kGSDX30` }, { text: `Race 5 1600M Meadowlands NJ April 5, 2025 : Always B Colour IR (1:52:0)`, url: `https://www.youtube.com/watch?v=rTj1Uj_baPM` }, { text: `FINALE UET ELITE CIRCUIT 2025`, url: `https://www.youtube.com/watch?v=y4Q7fMdtQes` }],
  },
  {
    category: "Racing",
    name: `Steeplechase`,
    the_sport: `Steeplechasing is a form of horse racing in which horses and riders compete over a long-distance course that includes a variety of natural and constructed obstacles. These obstacles typically include hedges, brush fences, timber fences, and water jumps, requiring both speed and jumping ability. The sport originated in Ireland, where riders raced between church steeples across open countryside—hence the name steeplechase.

Modern steeplechase races take place on established racecourses, and they test a horse’s endurance, agility, and jumping skill as well as the rider’s ability to maintain pace and safely navigate obstacles throughout the race.`,
    key_terms: `Course – The entire race track and series of jumps that horses must complete.

Finish Post – The marker that indicates the end of the race.`,
    judging: `Steeplechase judging is primarily based on which horse crosses the finish line first after successfully completing the entire course and all required jumps. Unlike many equestrian disciplines, steeplechase is a race rather than a scored event, so competitors are not judged on style or form.

Officials monitor the race to ensure that all obstacles are jumped correctly and that riders follow the proper course. Horses that refuse a jump, fall, or leave the course may be disqualified or unable to finish. Judges also verify the official finishing order, often using photo-finish technology when horses cross the line very close together.`,
    attire: `Tight english riding pants with tall boots. Long sleeve colored shirt and matching vest. Flat cap or helmet. Goggles/glasses optional.`,
    extra_links: [{ text: `GRAN DIOSE springs surprise in Grand Steeple-Chase de Paris`, url: `https://www.youtube.com/watch?v=uLGVSjN3hWc` }],
  },
  {
    category: "Other",
    name: `Combined Driving`,
    the_sport: `Combined driving is designed to test a Driver's ability as well as the horse's obedience, speed and athleticism, in three demanding phases with a carriage in tow: Driven Dressage, Marathon, and Cones. Competitors can drive a single horse/pony, a pair, or teams of 4. The driven dressage phase tests the Driver and their equine on harmony, impulsion, ease of movement, and suppleness through a sequence of scored movements in an arena. The second phase is the fast-paced and demanding cross-country marathon, which tests fitness, stamina, and agility. Along with a driver’s accuracy and judgment, the combination will navigate an intricate series of hazards which may include water, steep hills, and sharp turns - all within the fastest time possible. The final phase, a cones course, times the competitor as they accurately negotiate an intricate, winding course of narrowly-set cones without knocking them with the carriage wheels.`,
    key_terms: `Team -4 horses, sometimes 6.
Pair - 2 horses
Cart - 2 wheeled vehicle
Carriage - 4 wheeled vehicle
Leaders - horse(s) in the front of the team
Wheelers - horse(s) in the back of the team near the carriage`,
    judging: `In the dressage portion each move is judged based on 0-10 points. 0 means they didn’t do the move and 1 is the lowest score while 10 is the highest. The person with the least amount of penalty points wins. In the marathon section horses must navigate the course and penalty points are given if they miss an obstacle or do it wrong, if the wagon is damaged, or stopping. For the cones section penalties are given if cones are knocked over, exceeding the allowed time, damaging the carriage, or going off course.`,
    attire: `For the dressage portion it is dressage attire. For the marathon portion, general English attire with a protection vest. For the cones portion is show jumping or dressage attire.`,
    extra_links: [{ text: `Boyd Exell -ent as we know him | FEI Driving World Championship 2022`, url: `https://www.youtube.com/watch?v=2CcLd6h5B4I` }, { text: `RE-LIVE | Driving Marathon - Tryon 2018 | FEI World Equestrian Games™`, url: `https://www.youtube.com/watch?v=MholE-M6omw` }, { text: `Winning Ride: Chester Weber Cones Phase`, url: `https://www.youtube.com/watch?v=0AEEdAvk5YQ` }],
  },
  {
    category: "Other",
    name: `Gymkhana`,
    the_sport: `This is a mounted sport, typically in western, which requires riders to show their horsemanship via precise, controlled actions at high speed. The goal is to show control, skill and partnership while navigating obstacles, turning, and varying speed. In Gymkhana there are typically different races ranging from 4-12 different races. The ring often features poles and barrels as well as other obstacles or equipment. Gymkhana is flexible, any pattern can exist depending on the competition. It is also great for beginners as it introduces following a course and competing while showcasing relatively simple patterns that can range towards complicated as someone improves with the sport.`,
    key_terms: `Gymkhana: This word derives from an old term that meant a place of assembly. It morphed to mean a place where skill-based contests are held. In the horse world it means exactly that. It can be seen as a “field day” for horse riders with fun patterns and challenges.
Pattern: The course that the rider and horse runs for that race.
Race: One of multiple timed courses at the event. This is typically done solo or in pairs.`,
    judging: `This sport is based on time. Typically the fastest time wins.`,
    attire: `Anything Western.
Shirt: Western button up
Pants: Jeans with or without chaps
Hat: Cowboy Hat
Shoes: Western boots
Horse tack: Western Saddle Western Bridle`,
    extra_links: [{ text: `Images of Different Patterns`, url: `https://pmarena.com/gymkhana-patterns` }, { text: `More Patterns!`, url: `https://www.cambridgesaddleclub.org/assets/gymkhanapatterns.pdf` }, { text: `Video of a small Gymkhana Show`, url: `https://youtu.be/ibvovCudG_s?si=L0FlbGbr4Wv-vM9T` }, { text: `Gymkhana Intro`, url: `https://youtu.be/D3paH-MsXGU?si=XVMVcLPjHDdbAc3y` }],
  },
  {
    category: "Other",
    name: `Halter Show`,
    the_sport: `Horses are led in-hand and expected to be on their best behaviour. Athleticism, soundness and quality of movements are especially important in this sport, as horses need to be able to stand still, walk and trot on command and follow patterns precisely.`,
    key_terms: `Halter shows are also known as: In-Hand, Breeding, Model or Confirmation classes.

Exhibitor: The person leading their horse in-hand.
Performance Halter: A class offered to judge confirmation and resemblance to the breed ideal.
Showmanship at Halter: A class for youth and amateurs only, designed to judge the expertise of the exhibitors. They need to lead their horse through a pattern, being judged on their preciseness as well as their confidence. Exhibitors are given a score 60% based on their showmanship and performance of skills, 40% on grooming and preparation.`,
    judging: `Horses are judged based on confirmation, behaviour, if they have been groomed, are well taken care of etc. Exhibitors are judged on their showmanship as well as their confidence. Points and rules may vary.

Scoring: Many associations will use a scoring system from 0 to infinity, the average being 70 points.

Maneuver Score: Each maneuver indicated in the pattern receives a movement score of +3 to -3. 0 is an average, correct maneuver, +3 is an excellent maneuver while -3 is an extremely poor maneuver.

Form and Effectiveness Score: Each Exhibitor receives a Form and Effectiveness Score (F&E) to evaluate their overall horsemanship. 0-2 is average, 3 is good, 4 very good and 5 is excellent.
Penalties: Common penalty points are 3, 5 and 10. Exhibitors may also receive a 0 score or no score, given they are breaking patterns, breaking rules or are abusing their animal.`,
    attire: `Rider / Exhibitor: Show appropriate, clean clothes. Can be english or western depending on the type of show being hosted. Can be colorful & thematic if the event allows it.

Horse: A fitting halter.`,
    extra_links: [{ text: `Performance Halter Mares – 2024 AQHA World Championship Show`, url: `https://www.youtube.com/watch?v=_FyTlzoxqpU` }, { text: `A Judge’s Perspective: 2018 AQHYA 14-18 Showmanship`, url: `https://www.youtube.com/watch?v=PV_y8yw7I1c` }],
  },
  {
    category: "Other",
    name: `Jousting`,
    the_sport: `Coming around in the medieval and renaissance periods, this was a game between two competitors either on horse or foot. The word “joust” meaning a meeting. Most commonly seen on horse back. Jousting is based on the military use of the lance by heavy cavalry and the military training of the horse. While mostly using the lance, shorter range weapons were eventually used as well. Rival parties would occasionally fight in groups, or alone, and fight for their horses, arms, or ransoms. There was usually three rounds, morphing into five in the later time periods. In some cases, it was as high as ten to twelve rounds. This sport was considered extremely dangerous, even killing King Henry II of France. Now seen at reenactments such as at the Renaissance Faires and Medieval Times in the United States.`,
    key_terms: `List/Listing field: the arena the jousting takes place, or the roped off arena the fighting took place
Tiltyards: a venue for jousting tournaments Tilt (14th century): cloth barrier to separate the contestants. It became a wooden barrier in the 15th century. Used to prevent collisions Tilt (15th century): term for a joust
Chargers: medium-weight horses bred and trained for agility and stamina
Destriers: Heavier horses, similar to andalusians but not as large as the modern draft
Caparisons: ornamental cloth that went over the horse featuring the owner’s heraldic sign
Chanfron: iron shield that went on the horse's head to protect it`,
    judging: `Competitors gained points based on where their lance struck, if the lance was whole or splintered, or if the rider became unseated. More points were awarded to splintered lances and unseating your opponent.

There were a total of 8 rules found in a Jousting in Medieval and Renaissance Iberia book (summed up): 1: Knights should run only four courses. If one knight breaks the lance and the other did not, then the one who was unbroken loses. 2: If one knight splinters two lances and the other knight only one, then the winner shall be the one who splintered two lances. However, if the one who split only one knocks off the other with the same blow, than a tie shall be called 3: If one knight splinters two lances and the other knight knocks the knight off who splintered two, then a tie shall be declared 4: If a knight knocks down both horse and knight and the other knight only knocks off the other knight and not his horse, then the knight whose horse fell shall be considered the winner as it was the horse’s fault. In the case of the knight whose horse did not fall, the fault rests with the knight and not the horse 5: Lances shall only be judged for breaking after they strike the point 6: If each knight splinters the same amount of lances then a tie will be declared. If they do not hit each other at all, then they jousted poorly 7: If one knight drops his lance, the other knight shall raise his lance and not strike him as that would be unchivalrous 8: There shall be four judges in place, two assigned to each team`,
    attire: `Horse: caprison, chanfron, saddle, breast plate, horseshoes, bridle, plate armor
Rider: full armor, joust, sword, shield, spurs`,
    extra_links: [{ text: `Link to more about medieval horses`, url: `https://www.youtube.com/playlist?list=PLEdnpoTDGX7IcHAPCjTs5Vp-dz3LmZQG3` }, { text: `Medieval horse armor`, url: `https://www.youtube.com/watch?v=HjkU6HpwU-I` }],
  },
  {
    category: "Other",
    name: `Mounted Archery`,
    the_sport: `Mounted archery is an ancient, globally celebrated skill which combines horsemanship and traditional archery. While riding horseback, often at a canter or gallop (but sometimes at the walk/trot in novice classes) and with little to no rein contact, riders shoot a bow and arrow at various targets placed at different angles, heights and distances depending on the rules of each event. It has historically been utilized in hunting and warfare, particularly among the nomadic people of Eurasia, and was revived in Mongolia after their independence in 1921 as a display of skill during festivals such as the Naadam.

Modern-day mounted archery competitions usually occur on a straight track with rope, stake, or raised-ground barriers that guide the horse in a straight line, allowing the rider to focus on speed / accuracy rather than controlling the horse, though track shapes can vary depending on style, (some track styles include Korean, Hungarian, Persian, and Qabac or Turkish). Some of the more challenging tracks may require circles, diagonal changes, transitions, and shooting in various directions from the horse. Hunt tracks are done in an open field, designed to more closely simulate the challenges of hunting over a variety of terrain. Each rider will perform a certain number of rides/runs down the track, and their scores for each ride accumulate to give them their final score.`,
    key_terms: `Track - the designated path (typically 1.5-3m wide) clearly defined with a rope, stake, or raised-earth barrier the horse and rider must follow during their run, usually straight but sometimes curved/serpentine
Target - an object placed along the course (usually stationary but sometimes moving) which the archer must strike with their arrows.
Run-In/Run-Out - the designated space before the start line and after the finish line which allow the horse to come up to speed before the run, and slow down following the run
Run / Pass - a single trip down the course/track from the start line to the finish line
Set - a predetermined set of 6-9 runs following a particular track
Style - a particular set of rules of an event, such as Tower or Raid style
Quiver - a container for holding arrows attached to the rider, usually on the body, belt or upper leg. Raid (speed track) - an event that is speed-focused, archers gallop along a track of a certain length and fire at multiple targets in quick succession. Tower (Hungarian) - an event where the rider shoots at a raised central multi-faced target structure, called the “tower”, positioned beside the track often requiring shots at multiple angles
Hunt Track/Course - horse & rider are in an open field navigating natural terrain, jumps, and 3D targets placed along the track.
Par Time / Time Limit - the set time for a course used as the scoring benchmark, riders who complete course faster than this time may earn bonus points, while those who exceed it receive penalties (or possibly lose all points for the run)
Target/Arrow Points - points awarded to the rider for hitting targets, with higher points awarded for more accurate shots (center-hits score the highest)
Time Bonus - additional points awarded to the rider for completing the course under par / time limit (point per-second under) having shot enough arrows and hitting at least one target
Nocking - placing an arrow onto the bowstring in preparation to shoot
Release/Loose - releasing the bowstring to launch the arrow
Offside Shot - firing the bow with the non-dominant hand
Merida Target - a raised target where the angle of the shot is approximately 45 degrees above the horizontal
Back-shot - one of the hardest shots in mounted archery, it’s technique where the rider turns backwards to shoot a target behind them (6 o’clock position) while moving forward
Kikaç - from Turkish tradition, it’s an extreme back-shot at close range to a small target close to the ground, requiring a difficult downwards & backwards shot
Qabaq/Kabak - from Turkish tradition, the rider shoots at a high angle to a vertical target (60cm metal disc) raised on top of a pole, often requiring the rider to twist their upper body in order to hit it`,
    judging: `Mounted archery is judged on a combination of accuracy and time, in which the rider can accumulate target points, time bonuses, and penalties. Targets are divided into different zones, and hitting these different zones awards you a range of points (typically 1-5 points, center of target being the highest). If an arrow bounces off the target, it is considered a miss resulting in no points for that shot. If an arrow goes completely through a target, it is considered a valid shot. Time bonus points may be awarded for completing the course faster than the “par” time, while penalties may be given for exceeding the time limit. Final scores are calculated by combining all target points of all runs with any bonuses/penalties. Failure to meet the minimum number of arrows fired or targets hit, or failing to complete the course / going off-course may result in a zero-score for that run.`,
    attire: `Sturdy, closed-toed heeled boots and long pants/breeches are required. Comfortable, non-baggy clothing that allows movement is recommended. Modern or traditional costumes may be worn unless specific competition attire requirements are listed. Riding helmets are mandatory regardless of costume theme, and organizers must allow participants to wear body/back protectors if they wish.`,
    extra_links: [{ text: `International Horseback Archery Alliance (IHAA) 2025 Rulebook`, url: `https://www.ihaa.info/IHAA_Rulebook/rulebook.html` }, { text: `signing of an MoU`, url: `https://inside.fei.org/content/fei-board-resolutions-25-march-2025` }, { text: `MA3 Bows for Mounted Archery`, url: `https://www.youtube.com/watch?v=QUk-S15JnXs` }, { text: `MA3 Arrows for Mounted Archery`, url: `https://www.youtube.com/watch?v=yTevwdEtpcM&t=2s` }, { text: `How to Shoot an Arrow in Mounted Archery`, url: `https://www.youtube.com/watch?v=06QT1u-WLes` }, { text: `Helmet Cam POV - 2021 Silver Arrow Classic`, url: `https://www.youtube.com/watch?v=_-jWbHZJ_jU` }, { text: `Arizona Mounted Archery Club`, url: `https://www.youtube.com/watch?v=nf6ZMuryj0U` }, { text: `Nat Geo: Eva zu Beck trains like a Mongolian Warrior`, url: `https://www.youtube.com/watch?v=TyQnGPuMnA8` }],
  },
  {
    category: "Other",
    name: `Mounted Games`,
    the_sport: `Mounted Games competitions are comprised of several relay-style races requiring riders to pick up objects from the ground while remaining in the saddle, weave through a series of poles at high speeds, hand items off to teammates without slowing their mounts, and dunking objects into buckets (sometimes at a gallop). Teams are made up of two to five riders of the same skill level. Ponies are the preferred mount of choice for games as their shorter stature make several of the races much easier to play. Horses can be used but are much harder for riders to reach the ground from while remaining in the saddle and can be more difficult to mount/dismount at faster paces than a walk or standstill. Riders of any skill level and ability can compete in Mounted Games, with beginners usually competing at the Walk-Trot level.`,
    key_terms: `Tyre - Riders go in pairs. One dismounts, whilst other leads pony. Dismounted rider puts a tyre over themselves, vaults back on. On the way back the riders switch places and the original lead rider dismounts.
Rope - Two riders weave through the bending poles together.
Bending - One rider weaves through poles and rides back. Relay-style.
Stepping Stones - Rider has to ride up, dismount, walk along some stepping stones, then vault back on.`,
    judging: `There are a number of different games and you have to get creative a bit on the Rift but all games are basically relays. The team who finishes first wins as long as there was no cheating.`,
    attire: `Typically basic English attire with matching shirts for team mates.`,
    extra_links: [{ text: `Windsor: Pony Club Mounted Games: The Most FUN Equestrian Event!`, url: `https://www.youtube.com/watch?v=kTmLS06MMEg` }],
  },
  {
    category: "Other",
    name: `Mounted Orienteering`,
    the_sport: `Mounted Orienteering is all about navigation, either as a team or solo. The riders have to locate hidden objectives across various trails and terrains, using a compass and map. Up to 10 areas are marked with circles on the map, each containing one objective and scattered with clues for its locations. It’s essentially a mounted treasure hunt. Riders start with staggered intervals, with the goal to locate as many objectives as they can and return to the starting point in the least amount of time.`,
    key_terms: `Objective Stations - The “treasure”, paper plates with two letters, which need to be written down. They may not be removed or tampered with.
Clues - Written on the back of the map, each leading to the landmarks needed to find the Objective Stations.
Landmarks - Found within the circled areas on the map. Their location, combined with the clues and use of the compass, lead to the Objective Stations.
Ten Plate Course - Faster paced course with 10 Objective Stations to be found
Five Plate Course - Slower, beginner friendly course with 5 Objective Stations to be found`,
    judging: `The time starts when the competitors have received the map, and ends when the finish line is crossed. The fastest team/rider gets 6 time points, and an additional point for every Station letters found, incorrect letters will not be awarded. The placings are sorted by the amount of total points (time points + station points) No time points will be given if the ride exceeds the 6-hour mark. The use of any electronics, or other navigational tools other than those provided, is strictly forbidden.

In a team, if a member declares themselves “Out” due to horse or personal injury, the rest of the team may continue without their points being affected.`,
    attire: `Rider No outfit regulations. Helmets are recommended, as well as general trail riding attire like boots, gloves, and weather appropriate clothing. Horse No tack regulations, but endurance-like gear is commonly used.`,
    extra_links: [{ text: `Mounted Orienteering explained (With map example)`, url: `https://www.nacmo.org/intro_with_map.pdf` }, { text: `Map example pt. 2`, url: `https://www.nacmo.org/maps/INIL/Matt%20map.pdf` }, { text: `What Is Mounted Orienteering (Video)`, url: `https://www.youtube.com/watch?v=G7WJaFs9xYw` }],
  },
  {
    category: "Other",
    name: `Mounted Shooting`,
    the_sport: `Inspired by the wild wild West, mounted shooting is an exciting, fast-paced & timed equestrian sport that combines horsemanship with marksmanship. Riders navigate a pattern while firing blanks trying to hit balloon targets placed along the course (the powder from the blanks is what pops the balloons). The goal is to complete the course as quickly and accurately as possible while popping as many balloons as possible, as each missed balloon will add a 5-second time penalty. Patterns can include a variety of maneuvers including turning barrels, switching directions, and going through a “gate” or narrow opening. Patterns often include a “rundown,” a series of five balloons set in a straight line. The rider uses two .45-caliber revolvers, each carrying five rounds of black-powder blanks that have a range of about 10-15 feet. After the first five shots, the rider must holster their first gun and unholster their second. There is also a riddle class, which requires one pistol and one rifle to be used (five shots of each). There are six classes of skill levels, with novice riders beginning in Class 1 and advanced riders in Class 6. Safety is a top priority at mounted shooting events, as guns are kept unloaded until each competitor enters the ring. Horses used in mounted shooting must be confident, calm, agile, and desensitized to loud gunfire, as the sport requires rapid movement and repeated shots in close proximity.`,
    key_terms: `Pattern: A pre-designed course layout that riders must follow while shooting the targets in the correct order.
Stage: A single timed run of a specific course pattern.
Balloon Target: A balloon mounted on a stand which riders must shoot.
Blank/Blank Cartridge: A special ammunition cartridge (called .45 caliber Long Colts) containing gunpowder but no bullet. The powder blast pops the balloon when fired from a distance of about 10-15 feet.
Holster: A leather holder attached to the rider’s belt, used to carry the revolvers.
Single-Action Revolver: A style of pistol where the hammer must be manually cocked before each shot.
Run: A rider’s timed attempt at completing the course.
Penalty: Extra time added to a rider’s score for errors such as missing a balloon, dropping a gun or riding an incorrect pattern.`,
    judging: `Mounted shooting is primarily judged based on time and accuracy. Riders are timed from the moment they cross the starting line until they cross the finish line after completing the pattern. The fastest clean run wins. Time penalties are added to a rider’s time for errors such as:
• Missing a balloon target (+5s each)
• Dropping a Gun (+5s)
• Falling off or dismounting your horse (+60s)
• Knocking over a gate pole or barrel (+5s each)
• Entering arena without a cowboy hat/helmet (+5s)
• Discharge gun before timer starts (+5s)
• Both guns unholstered at once (+5s)
• Course Errors (+10s, only one per stage) - failure to round a barrel, go through a gate, follow the prescribed pattern, firing at targets in the wrong order
• Crossing the finish line before completing the pattern (+60s)
• Firing more than 5 rounds per gun (+60s)
• Failure to follow dress code (+60s)
• Any run longer than 60s shall be considered a DQ
• Showboating, gun-twirling, acting unsafe (+60s)
• One-handed shooting a rifle/shotgun (+10s)
• Safety rule violation (DQ) Accidental discharge outside the arena (+60s on current stage)

Since penalties increase a rider’s time, competitors must balance speed & efficiency around the pattern, control of their horse, and accuracy in actually hitting all of the balloon targets. Most patterns take about 15-35 seconds, so penalties can make or break a placement.`,
    attire: `Clothing - a Western hat or helmet, long sleeve button-down Western shirt, jeans or Western riding pants, chaps, and Western boots, holster. Vests, gloves & period-style clothing are optional.
Guns - Pistols: .45 caliber single-action revolvers, Rifles: .44-.40 rifles, Shotguns: 12ga, 20ga, or .410ga shotguns
Tack - Western style saddle & bridle, protective leg wraps/boots optional
Horse - Any breed, should be athletic, trainable, calm & desensitized to close-proximity gunfire.`,
    extra_links: [{ text: `Book of USMS Patterns`, url: `https://usmountedshooting.com/wp-content/uploads/2025/01/1-USMS-Pattern-Book-1225.pdf` }, { text: `USMS Rulebook`, url: `https://usmountedshooting.com/wp-content/uploads/2024/12/USMS-Rules-Regulations.pdf` }, { text: `Mounted Shooting in the News`, url: `https://www.youtube.com/watch?v=O8VUmJ3bjao` }, { text: `Enjoy 20 Mins of Mounted Shooting Competition`, url: `https://www.youtube.com/watch?v=AzpLMpWd_lI` }, { text: `2025 AQHA Mounted Shooting Open World Champion`, url: `https://www.youtube.com/watch?v=VdHL0pgjQdQ` }],
  },
  {
    category: "Other",
    name: `O-Mok-See`,
    the_sport: `The name “O-Mok-See” comes from the Blackfoot (Niitsitapi) language and is derived from the phrase “oh-mak-see pass-kan” often translated as “riding big dance”. It is a term which historically referred to a ceremonial mounted war gathering in which Blackfoot warriors displayed horsemanship while elders sang and drummed to inspire courage & enthusiasm before setting out on an expedition against the enemy. The modern sport of O-Mok-See was developed much later through western saddle clubs and is not the same as the traditional ceremony. Instead, it refers to a collection of timed speed events like barrel racing & pole pending. The name reflects the long cultural importance of horses & mounted skill within Western Plains Indigenous communities.
All events are run in 30-foot wide lanes, with a turning line at the end of each lane. The riders within each lane are timed individually.`,
    key_terms: `Start/Finish Line - designated point or line in the lane where the rider’s time begins and ends, usually containing a photo-eye timer with a laser beam across the line which times each rider individually. “Ready Light” - signifies an active system of the photo-eye timer beam set across the start/finish line. When a horse crosses the beam, the timer begins automatically, and stops when the rider crosses the beam again. The announcer will signify to the rider they may begin their run by saying something along the lines of “We have a ready light”.
Turning Line - a designated point or line where horse & rider must turn around and complete the rest of the pattern.
Pattern - a specific course layout riders must follow during their run.
Run - a rider’s timed attempt at completing the pattern.
Lane - the marked (usually with cones, poles, chalk lines, etc), straight path that riders must stay within during their run. Lanes are 30-feet wide and usually 165-feet in length, and arenas typically have four lanes. Leaving or crossing the lane boundary (with all 4 hooves) can result in a penalty or DQ.
Time Penalty - a predetermined amount of extra time added to a rider’s final run time for errors such as leaving the boundary, failing to follow a pattern, or knocking over property
Property - any item used during an event, such as barrels, poles, stakes, cones, flags, or other markers
Stake - typically a removable rod placed in a barrel or holder the rider must pick up, carry, or place during the pattern
Pole / Pole Bending Stake - a fixed upright marker placed along the pattern that the horse moves around or weaves between
Examples of some O-Mok-See Events:
• Arena Race: rider races to a pole centered on the turning line, makes a left or right turn around the pole, and races back to the finish line.
• Barrel & Stake: rider races between barrels moving stakes from one barrel to another, one at a time
• Cloverleaf Barrel Race: rider circles three barrels in a cloverleaf pattern
• Figure-8 Pole Race: rider circles two poles in a figure-8 pattern
• Flag Race - rider picks up a flag from a barrel and carries it across the finish line
• Flying W - rider weaves through poles arranged in a W-shaped pattern
• Half Eight - rider turns between two poles at the end of the lane staggered 6-feet apart, then turns around at the turning line and runs to the finish line
• Key/Keyhole Race - rider enters a narrow keyhole pattern, turns inside the circle, and exits through the lane
• Keg Race - rider weaves through a line of small barrels or cones set 25 feet apart and returns through them (same as a pole-bending pattern)
• Pole Bending - rider weaves through a line of vertical poles set 21 feet apart and returns through them
• Polo Turn - rider races to a pole centered on turning line, makes a complete circle (1.5 revolutions) to the left or right around the pole, then returns to cross finish line.
• Scurry Race - rider crosses a set of one, two or three ground poles or small jumps followed by turning right or left around a barrel at the end of the lane, then returns over the poles/jumps again to the finish line.
• Speed Barrels - rider weaves through a line of three barrels set 50 feet apart and returns through them (similar to a pole-bending pattern)
• Straight Barrels - three barrels centered in lane set 55 feet apart, rider circles each barrel to the left or right, then circles each barrel in the opposite direction on the way back to the finish line
• Tomahawk Race - a barrel open-end up is centered in the lane 30 feet from the starting line, and a second barrel closed-end up is centered on the turning line with a “tomahawk” (a 15-inch piece of PVC pipe or hose) sitting on it. Rider races to turn around the barrel on the turning line, grabbing the tomahawk along the way, and dropping it in the first barrel before crossing the finish line.
• Two Barrel Flag - rider races to first barrel centered in the lane 30 feet from the starting line, picks up a colored flag/stake, races to the second barrel centered on the turning line, deposits the flag/stake and picks up the second different colored flag/stake and races to the first barrel, depositing it before crossing the finish line.
• Rescue Race - a two-person relay, rider races to the turning line, picks up a passenger and rides back to the finish line.`,
    judging: `O-Mok-See is judged on speed and accuracy. Riders are timed individually on the pattern within their own lane, and the competitor with the fastest correct run wins. Each rider performs the required pattern as quickly as possible, and timing begins/ends when the horse crosses the start/finish line. Mistakes such as knocking poles/barrels over, missing an obstacle, or leaving the required pattern may receive either time penalties or be DQ’d receiving a “No Time (NT)” score.

Contestants enter the arena and stand ready in front of their assigned lane and wait for the “Ready Light” signal by the announcer. Any rider who crosses the timer line before a “Ready Light” signal has been given will be DQ’d. After the first horse crosses the beam of the starting line and starts the automatic timer, remaining contestants will have 10 seconds to start their run. Any rider who crosses the start/finish line of someone else’s lane will be DQ’d.`,
    attire: `All races must be ridden with Western-style tack (bridle/saddle). A contestant who is wearing non-Western attire or equipment when they enter the arena will be DQ’d.
Shirts: Western-style long-sleeved collared shirts of any color
Pants: Long Western slacks or blue jeans/pants
Boots: Traditional Western-style boots with a heel required
Headgear: Traditional Western-style hats, caps, or helmets are allowed.
Chaps/Half-chaps made of leather are optional.`,
    extra_links: [{ text: `O-Mok-See Speed Barrels`, url: `https://www.youtube.com/watch?v=kA759giYyOE` }, { text: `Half-Eight from First Person View`, url: `https://www.youtube.com/watch?v=FiRDcmaR6jE` }, { text: `O-Mok-See Stake Race 2016`, url: `https://www.youtube.com/watch?v=VofuYyqOpJE` }, { text: `O-Mok-See Keyhole Race 2020`, url: `https://www.youtube.com/watch?v=jxpQKz073Ec` }, { text: `Rescue Race Compilation`, url: `https://www.youtube.com/watch?v=yyiH4MZYiLw` }, { text: `O-Mok-See Rulebook 2025`, url: `https://drive.google.com/file/d/1S6I-YYuePc3834AA1e-vFKRNfkJFU0Pt/view` }],
  },
  {
    category: "Other",
    name: `Pleasure Riding`,
    the_sport: `Unlike “English Pleasure” type classes held within equestrian competitions, where the horse is judged on appearing “pleasurable” to ride, Pleasure Riding itself refers to recreational riding for personal enjoyment, without any elements of judging or competition. Pleasure riding can take place both inside an arena or outside on trails, fields, public lands, beaches, or designated riding lanes/bridleways. In some regions, pleasure riding outside of the arena is referred to as “hacking”. While the ideal pleasure riding horse is calm, confident, and not easily spooked, pleasure riding is also a fantastic way to expose young or inexperienced horses to new environments, helping them build their confidence.`,
    key_terms: `Footing - condition of the ground (such as muddy, sandy, rocky, etc)
Hill Work - riding up or down hills to build condition / strength
Hack / Hacking out - riding a horse outside of an enclosed arena for pleasure or exercise
On the Buckle - riding with loose reins with minimal contact
Surefooted - a horse that is careful with its foot placement and handles rough terrain with confidence
Looky - a horse who has a tendency to be easily distracted by its environment
Fresh - a horse who is very energetic or excited
Green - a horse who lacks experience
Traffic Safe - a horse who is confident/calm around vehicles & road traffic
Buddy Sour - a horse who is bonded with other horses and reluctant to leave them
Lead Horse - the horse & rider leading from the front of the group
One-Rein Stop - a form of an emergency stop which forces the horse to turn its head`,
    judging: `As Pleasure Riding is a recreational form of riding, there are no elements of judging.`,
    attire: `Clothing - there are no specific clothing or equipment requirements for pleasure riding, however it is recommended that riders wear non-baggy, comfortable clothing with long pants, closed-toed boots with a low heel, and fitted tops. It’s also recommended to wear a helmet for head protection, and to ride wearing layers in case weather conditions change.
Tack - while there are no specific requirements for English or Western tack when pleasure riding, it’s recommended that all equipment is functional, in good condition, and properly fitting & comfortable for both you and the horse. Many riders often pleasure ride with a halter worn underneath the bridle, in case of emergencies.`,
    extra_links: [{ text: `“Why Sport Horses Need to Hack Out”`, url: `https://sanoanimal.com/en/2025/07/08/out-of-the-arena-why-sport-horses-need-to-hack-out/` }, { text: `Pleasure Riding on the Beach`, url: `https://www.youtube.com/watch?v=Hl8iEqoBph4` }, { text: `Pleasure Riding in Scotland`, url: `https://www.youtube.com/watch?v=b75wO0PEZsk` }],
  },
  {
    category: "Other",
    name: `Skijoring`,
    the_sport: `Skijoring is the act of a person being pulled on skis by horse and rider (usually). This sport is a high speed sport where the horse and rider race down a snowy track and the skier is pulled behind and skis through check points along the way. These checkpoints can be jumps, gates, and rings. The track is typically 270-370 meters long.`,
    key_terms: `Gates: typically two poles that the skier must pass through
Rings: These large circles that can fit around a person's arm and are collected by the skier.
Jumps: Made in the snow that the skier must go up to jump in the air as they move through the course.`,
    judging: `This is a timed event so the fastest time wins.
Penalties can be as follows:
• each missed or dropped ring
• Each missed gate
• If horse hits a gate
• If horse breaks the plane of any jump
• DQ if horse runs over start or finish board
• If skier misses a jump Typically skier must be holding the rope across the finish line to keep a score.`,
    attire: `Shirt: Button up, western style
Coat: Wintery
Pants: Jeans or Winterized Chaps
Boots: Cowboy boots.
Hat: Cowboy hat
Optional but recommended: Helmets and Protected Vests

The Skier/Snowboarder must wear snow sport approved helmet and eye protection is recommended

Horse Tack: Western Bridle Western Saddle with a solid horn.`,
    extra_links: [{ text: `Skijoring Video`, url: `https://youtu.be/BL_BLm60zgc?si=4QVA57Meal2ZeUJb` }, { text: `Really Intense Skijoring Vid`, url: `https://youtu.be/6X5Qq8fS_iw?si=zlmGFm6Td_ggumdP` }, { text: `Vid from the perspective of the skier`, url: `https://youtu.be/dILLnbH8zVs?si=G2Y7D6bvqgfnlFl4` }],
  },
  {
    category: "Other",
    name: `Trail Riding`,
    the_sport: `Unlike “Western Trail” classes in Western equestrian competitions, Trail Riding itself is a recreational form of riding focused on pleasure & enjoyment rather than judging or competition (though it can sometimes be organized as a casual group event). Trail riding occurs outside of an arena, usually on natural terrain or designated riding trails in environments such as forests, fields, mountains, etc. Trail riders may encounter challenges such as wildlife, natural obstacles, water crossings, or difficult / uneven terrain and therefore a confident, surefooted, unflappable horse is recommended. However, trail riding is a great way to help boost a horse’s confidence and experience.`,
    key_terms: `Trail - a designated path for riding
Obstacle - a natural object in the path which a horse & rider must navigate, such as fallen trees / logs, water crossings, bridges, gates, ditches, etc
Surefooted - a horse that is careful with its foot placement and handles rough terrain with confidence
Looky - a horse who has a tendency to be easily distracted by its environment
Fresh - a horse who is very energetic or excited
Green - a horse who lacks experience
Buddy Sour - a horse who is bonded with other horses and reluctant to leave them
One-Rein Stop - a form of an emergency stop which forces the horse to turn its head
Natural Mount - mounting the horse from the ground, or using natural features such as rocks or locks in place of a mounting block
Trail Etiquette - guidelines for behavior on shared trails to show respect for others, such as yielding, maintaining space, packing trash with you rather than leaving it behind, etc
Yielding the Trail - giving the right-of-way to other trail users such as hikers / bikers, often by by moving off to the side of the path and stopping (though in most multi-use trails, horses almost always have the right-of-way)
Lead Horse - the horse & rider leading from the front of the group
Drag Rider - the horse & rider at the back of the group who usually ensure no riders are left behind`,
    judging: `Similar to Pleasure Riding, Trail Riding is a recreational form of riding, there are no elements of judging.`,
    attire: `Clothing - there are no specific clothing or equipment requirements for trail riding, however it is recommended that riders wear non-baggy, comfortable clothing with long pants, closed-toed boots with a low heel, and fitted tops. It’s also highly recommended to wear a helmet for head protection, and to ride wearing layers in case weather conditions change.
Tack - while there are no specific requirements for English or Western tack when trail riding, it’s recommended that all equipment is functional, in good condition, and properly fitting & comfortable for both you and the horse. Many riders often trail ride with a halter worn underneath the bridle, in case of emergencies. Other equipment often used for trail rides include saddle bags, breast collar / crupper to keep the saddle secure, protective boots or wraps to protect the horse’s hooves or legs, and emergency / first-aid gear.`,
    extra_links: [{ text: `Trail Ride in the Snow`, url: `https://youtu.be/YOl_De9A7ho?t=61` }, { text: `Backcountry Rock Crawling with Mules`, url: `https://www.youtube.com/watch?v=BmrKh--LHo4` }, { text: `Trail Riding in South Dakota Mountains`, url: `https://www.youtube.com/watch?v=fB8ZRcKQfBM` }, { text: `Horseback River Crossing in Wyoming`, url: `https://www.youtube.com/watch?v=xYdWYq1_VN0` }, { text: `Camping & Mule Trail Riding in Colorado`, url: `https://www.youtube.com/watch?v=HfZRwBVEzYA` }, { text: `The History of the Trail Ride Tradition`, url: `https://www.youtube.com/watch?v=7hws6HItWWw` }],
  },
];