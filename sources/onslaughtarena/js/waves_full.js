horde.isDemo = function () {
	return false;
};

horde.populateWaves = function (engine) {

	// FULL GAME WAVES

	// Wave 1: Level 1
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "bat", 1);
	w.addObjects(1, "bat", 1);
	w.addObjects(2, "bat", 1);
	engine.waves.push(w);

	// Wave 2
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "goblin", 2);
	w.addObjects(1, "goblin", 2);
	w.addObjects(2, "goblin", 2);
	engine.waves.push(w);

	// Wave 3
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "cyclops", 1);
	engine.waves.push(w);

	// Wave 4
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "demoblin", 2);
	w.addObjects(1, "demoblin", 3);
	w.addObjects(2, "demoblin", 2);
	engine.waves.push(w);

	// Wave 5
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 500);
	w.addSpawnPoint(1, 750);
	w.addSpawnPoint(2, 500);
	w.addObjects(0, "bat", 5);
	w.addObjects(0, "goblin", 2);
	w.addObjects(1, "goblin", 2);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(1, "goblin", 3);
	w.addObjects(2, "bat", 5);
	w.addObjects(2, "goblin", 2);
	engine.waves.push(w);
	
	// Wave 6
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 200);
	w.addSpawnPoint(1, 200);
	w.addSpawnPoint(2, 200);
	w.addObjects(0, "bat", 10);
	w.addObjects(1, "bat", 10);
	w.addObjects(2, "bat", 10);
	engine.waves.push(w);
	
	// Wave 7
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "demoblin", 3);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(1, "goblin", 5);
	w.addObjects(2, "demoblin", 3);
	engine.waves.push(w);

	// Wave 8
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 5000);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, "imp", 5);
	w.addObjects(1, "imp", 10);
	w.addObjects(2, "imp", 5);
	engine.waves.push(w);

	// Wave 9
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 750);
	w.addSpawnPoint(1, 750);
	w.addSpawnPoint(2, 750);
	w.addObjects(0, "cyclops", 1);
	w.addObjects(2, "cyclops", 1);
	w.addObjects(0, "bat", 10);
	w.addObjects(1, "bat", 10);
	w.addObjects(2, "bat", 10);
	engine.waves.push(w);

	// Wave 10: Gelatinous Cube
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "cube", 1);
	w.bossWave = true;
	w.bossName = "Gelatinous Cube";
	engine.waves.push(w);

	// Wave 11: Level 2
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 20000);
	w.addSpawnPoint(1, 20000);
	w.addSpawnPoint(2, 20000);
	w.addObjects(0, "sandworm", 2);
	w.addObjects(1, "sandworm", 2);
	w.addObjects(2, "sandworm", 2);
	engine.waves.push(w);

	// Wave 12
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 10000);
	w.addSpawnPoint(1, 10000);
	w.addSpawnPoint(2, 10000);
	w.addObjects(0, "wizard", 2);
	w.addObjects(1, "wizard", 2);
	w.addObjects(2, "wizard", 2);
	engine.waves.push(w);

	// Wave 13
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 7500);
	w.addSpawnPoint(1, 7500);
	w.addSpawnPoint(2, 7500);
	w.addObjects(0, "flaming_skull", 2);
	w.addObjects(1, "flaming_skull", 2);
	w.addObjects(2, "flaming_skull", 2);
	engine.waves.push(w);

	// Wave 14
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, "owlbear", 1);
	w.addObjects(2, "owlbear", 1);
	engine.waves.push(w);

	// Wave 15
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "huge_skull", 1);
	w.addObjects(1, "huge_skull", 1);
	w.addObjects(2, "huge_skull", 1);
	engine.waves.push(w);

	// Wave 16
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 500);
	w.addSpawnPoint(1, 4000);
	w.addSpawnPoint(2, 500);
	w.addObjects(0, "dire_bat", 5);
	w.addObjects(0, "hunter_goblin", 2);
	w.addObjects(0, "dire_bat", 5);
	w.addObjects(0, "hunter_goblin", 2);
	w.addObjects(1, "sandworm", 2);
	w.addObjects(2, "dire_bat", 5);
	w.addObjects(2, "hunter_goblin", 2);
	w.addObjects(2, "dire_bat", 5);
	w.addObjects(2, "hunter_goblin", 2);
	engine.waves.push(w);

	// Wave 17
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, "flaming_skull", 2);
	w.addObjects(1, "imp", 5);
	w.addObjects(1, "wizard", 3);
	w.addObjects(2, "flaming_skull", 2);
	engine.waves.push(w);

	// Wave 18
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1500);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 1500);
	w.addObjects(0, "cyclops", 1);
	w.addObjects(0, "goblin", 5);
	w.addObjects(1, "demoblin", 3);
	w.addObjects(1, "owlbear", 1);
	w.addObjects(1, "demoblin", 5);
	w.addObjects(2, "goblin", 5);
	w.addObjects(2, "cyclops", 1);
	engine.waves.push(w);

	// Wave 19
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3500);
	w.addSpawnPoint(1, 4000);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, "wizard", 5);
	w.addObjects(1, "imp", 5);
	w.addObjects(1, "owlbear", 1);
	w.addObjects(2, "sandworm", 3);
	engine.waves.push(w);

	// Wave 20: Minotaur
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "superclops", 1);
	w.bossWave = true;
	w.bossName = "Minotaur"
	engine.waves.push(w);
	
	// Wave 21: Level 3
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 100);
	w.addSpawnPoint(1, 100);
	w.addSpawnPoint(2, 100);
	w.addObjects(0, "bat", 15);
	w.addObjects(1, "dire_bat", 15);
	w.addObjects(2, "bat", 15);
	engine.waves.push(w);

	// Wave 22
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1500);
	w.addSpawnPoint(1, 1500);
	w.addSpawnPoint(2, 1500);
	w.addObjects(0, "goblin", 15);
	w.addObjects(1, "hunter_goblin", 15);
	w.addObjects(2, "goblin", 15);
	engine.waves.push(w);

	// Wave 23
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 2000);
	w.addSpawnPoint(1, 2000);
	w.addSpawnPoint(2, 2000);
	w.addObjects(0, "demoblin", 12);
	w.addObjects(1, "demoblin", 12);
	w.addObjects(2, "demoblin", 12);
	engine.waves.push(w);

	// Wave 24
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 25000);
	w.addSpawnPoint(1, 25000);
	w.addSpawnPoint(2, 25000);
	w.addObjects(0, "cyclops", 2);
	w.addObjects(1, "cyclops", 2);
	w.addObjects(2, "cyclops", 2);
	engine.waves.push(w);
	
	// Wave 25
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 3000);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, "imp", 10);
	w.addObjects(1, "imp", 10);
	w.addObjects(2, "imp", 10);
	engine.waves.push(w);
	
	// Wave 26
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 25000);
	w.addSpawnPoint(1, 25000);
	w.addSpawnPoint(2, 25000);
	w.addObjects(0, "owlbear", 2);
	w.addObjects(1, "owlbear", 2);
	w.addObjects(2, "owlbear", 2);
	engine.waves.push(w);
	
	// Wave 27
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 12000);
	w.addSpawnPoint(1, 12000);
	w.addSpawnPoint(2, 12000);
	w.addObjects(0, "wizard", 4);
	w.addObjects(1, "wizard", 4);
	w.addObjects(2, "wizard", 4);
	engine.waves.push(w);
	
	// Wave 28
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 20000);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, "flaming_skull", 5);
	w.addObjects(1, "huge_skull", 3);
	w.addObjects(2, "flaming_skull", 5);
	engine.waves.push(w);
	
	// Wave 29
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 15000);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, "sandworm", 5);
	w.addObjects(1, "sandworm", 5);
	w.addObjects(2, "sandworm", 5);
	engine.waves.push(w);
	
	// Wave 30: Green Dragon
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "dragon", 1);
	w.bossWave = true;
	w.bossName = "Green Dragon"
	engine.waves.push(w);

	// Wave 31: Level 4
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3500);
	w.addSpawnPoint(1, 3500);
	w.addSpawnPoint(2, 3500);
	w.addObjects(0, "goblin", 25);
	w.addObjects(1, "demoblin", 25);
	w.addObjects(2, "hunter_goblin", 25);
	engine.waves.push(w);

	// Wave 32
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 7500);
	w.addSpawnPoint(1, 5000);
	w.addSpawnPoint(2, 7500);
	w.addObjects(0, "sandworm", 2);
	w.addObjects(0, "wizard", 3);
	w.addObjects(1, "imp", 10);
	w.addObjects(2, "sandworm", 2);
	w.addObjects(2, "wizard", 3);
	engine.waves.push(w);

	// Wave 33
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 7500);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, "owlbear", 3);
	w.addObjects(1, "flaming_skull", 6);
	w.addObjects(2, "owlbear", 3);
	engine.waves.push(w);

	// Wave 34
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 2500);
	w.addSpawnPoint(1, 15000);
	w.addSpawnPoint(2, 2500);
	w.addObjects(0, "demoblin", 10);
	w.addObjects(0, "goblin", 10);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(1, "owlbear", 1);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(1, "owlbear", 1);
	w.addObjects(2, "demoblin", 10);
	w.addObjects(2, "goblin", 10);
	engine.waves.push(w);

	// Wave 35
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 12500);
	w.addSpawnPoint(1, 20000);
	w.addSpawnPoint(2, 12500);
	w.addObjects(0, "sandworm", 5);
	w.addObjects(1, "huge_skull", 1);
	w.addObjects(1, "owlbear", 1);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(1, "huge_skull", 1);
	w.addObjects(2, "sandworm", 5);
	engine.waves.push(w);

	// Wave 36
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 20000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 20000);
	w.addObjects(0, "cyclops", 1);
	w.addObjects(0, "flaming_skull", 1);
	w.addObjects(1, "wizard", 8);
	w.addObjects(2, "cyclops", 1);
	w.addObjects(2, "flaming_skull", 1);
	engine.waves.push(w);

	// Wave 37
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 4000);
	w.addSpawnPoint(1, 10000);
	w.addSpawnPoint(2, 4000);
	w.addObjects(0, "demoblin", 8);
	w.addObjects(1, "owlbear", 2);
	w.addObjects(2, "demoblin", 8);
	engine.waves.push(w);

	// Wave 38
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 5000);
	w.addSpawnPoint(1, 7500);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, "sandworm", 1);
	w.addObjects(0, "wizard", 3);
	w.addObjects(1, "flaming_skull", 4);
	w.addObjects(1, "huge_skull", 1);
	w.addObjects(2, "sandworm", 1);
	w.addObjects(2, "wizard", 3);
	engine.waves.push(w);
	
	// Wave 39
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 2000);
	w.addSpawnPoint(1, 2500);
	w.addSpawnPoint(2, 2000);
	w.addObjects(0, "goblin", 30);
	w.addObjects(1, "demoblin", 25);
	w.addObjects(2, "hunter_goblin", 30);
	engine.waves.push(w);

	// Wave 40: Beholder
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "beholder", 1);
	w.bossWave = true;
	w.bossName = "Beholder"
	engine.waves.push(w);
	
	// Wave 41: Level 5
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 3000);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, "cyclops", 2);
	w.addObjects(1, "owlbear", 2);
	w.addObjects(2, "cyclops", 2);
	engine.waves.push(w);

	// Wave 42
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "wizard", 3);
	w.addObjects(0, "flaming_skull", 1);
	w.addObjects(1, "wizard", 3);
	w.addObjects(1, "huge_skull", 1);
	w.addObjects(2, "wizard", 3);
	w.addObjects(2, "flaming_skull", 1);
	engine.waves.push(w);

	// Wave 43
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 3000);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, "sandworm", 3);
	w.addObjects(0, "owlbear", 1);
	w.addObjects(1, "sandworm", 3);
	w.addObjects(1, "huge_skull", 1);
	w.addObjects(2, "sandworm", 3);
	w.addObjects(2, "cyclops", 1);
	engine.waves.push(w);

	// Wave 44
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 200);
	w.addSpawnPoint(1, 200);
	w.addSpawnPoint(2, 200);
	w.addObjects(0, "dire_bat", 20);
	w.addObjects(0, "wizard", 2);
	w.addObjects(0, "cyclops", 1);
	w.addObjects(1, "dire_bat", 20);
	w.addObjects(1, "sandworm", 2);
	w.addObjects(1, "owlbear", 1);
	w.addObjects(2, "dire_bat", 20);
	w.addObjects(2, "wizard", 2);
	w.addObjects(2, "cyclops", 1);
	engine.waves.push(w);

	// Wave 45
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 3000);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, "goblin", 10);
	w.addObjects(0, "cyclops", 1);
	w.addObjects(0, "wizard", 3);
	w.addObjects(1, "demoblin", 10);
	w.addObjects(1, "huge_skull", 1);
	w.addObjects(1, "sandworm", 3);
	w.addObjects(2, "hunter_goblin", 10);
	w.addObjects(2, "owlbear", 1);
	w.addObjects(2, "flaming_skull", 3);
	engine.waves.push(w);

	// Wave 46
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 2500);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 2500);
	w.addObjects(0, "wizard", 4);
	w.addObjects(1, "cube", 1);
	w.addObjects(2, "wizard", 4);
	engine.waves.push(w);

	// Wave 47
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "demoblin", 5);
	w.addObjects(1, "superclops", 1);
	w.addObjects(1, "demoblin", 4);
	w.addObjects(2, "demoblin", 5);
	engine.waves.push(w);

	// Wave 48
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 30000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 30000);
	w.addObjects(0, "sandworm", 1);
	w.addObjects(0, "owlbear", 1);
	w.addObjects(1, "dragon", 1);
	w.addObjects(2, "sandworm", 1);
	w.addObjects(2, "owlbear", 1);
	engine.waves.push(w);

	// Wave 49
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 15000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 15000);
	w.addObjects(0, "wizard", 1);
	w.addObjects(0, "cyclops", 1);
	w.addObjects(1, "beholder", 1);
	w.addObjects(2, "wizard", 1);
	w.addObjects(2, "cyclops", 1);
	engine.waves.push(w);

	// Wave 50: Doppelganger
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "doppelganger", 1);
	w.bossWave = true;
	w.bossName = "Doppelganger"
	engine.waves.push(w);
	
};
