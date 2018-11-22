/**
 * Levels array made up of Level objects
 *
 * Level object:
 *  id: int
 *  title: String
 *  waves: The number of waves of ducks in a level
 *  ducks: The number of ducks per wave
 *  pointsPerDuck: int
 *  speed: int Speed of ducks on an increasing scale of 1-10
 *  bullets: int Bullets provided per wave
 *  time: int Time in seconds to complete each wave
 * @type {Array}
 */
var levels = [
    {
        id: 1,
        title: 'Level 1',
        waves: 3,
        ducks: 2,
        pointsPerDuck: 100,
        speed: 5,
        bullets: 3,
        time: 13
    },
    {
        id: 2,
        title: 'Level 2',
        waves: 5,
        ducks: 3,
        pointsPerDuck: 100,
        speed: 6,
        bullets: 4,
        time: 10
    },
    {
        id: 3,
        title: 'Level 3',
        waves: 6,
        ducks: 3,
        pointsPerDuck: 100,
        speed: 7,
        bullets: 4,
        time: 10
    },
    {
        id: 4,
        title: 'Level 4',
        waves: 3,
        ducks: 10,
        pointsPerDuck: 100,
        speed: 7,
        bullets: 11,
        time: 18
    },
    {
        id: 5,
        title: 'Level 5',
        waves: 5,
        ducks: 2,
        pointsPerDuck: 100,
        speed: 8,
        bullets: 3,
        time: 13
    },
    {
        id: 6,
        title: 'Level 6',
        waves: 1,
        ducks: 15,
        pointsPerDuck: 100,
        speed: 8,
        bullets: 15,
        time: 25
    }

];