horde.isDemo = function () {
	return true;
};

horde.populateWaves = function (engine) {

	// DEMO WAVES

	// Wave 1: Level 1
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 5000);
	w.addSpawnPoint(1, 5000);
	w.addSpawnPoint(2, 5000);
	w.addObjects(0, "bat", 1);
	w.addObjects(1, "bat", 1);
	w.addObjects(2, "bat", 1);
	engine.waves.push(w);

	// Wave 2
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 3000);
	w.addSpawnPoint(1, 3000);
	w.addSpawnPoint(2, 3000);
	w.addObjects(0, "goblin", 5);
	w.addObjects(1, "goblin", 5);
	w.addObjects(2, "goblin", 5);
	engine.waves.push(w);

	// Wave 3
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 750);
	w.addSpawnPoint(1, 750);
	w.addSpawnPoint(2, 750);
	w.addObjects(1, "cyclops", 1);
	w.addObjects(0, "bat", 10);
	w.addObjects(1, "bat", 10);
	w.addObjects(2, "bat", 10);
	engine.waves.push(w);

	// Wave 4
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "demoblin", 1);
	w.addObjects(1, "wizard", 3);
	w.addObjects(2, "demoblin", 1);
	engine.waves.push(w);

	// Wave 5: Gelatinous Cube
	var w = new horde.SpawnWave();
	w.addSpawnPoint(1, 1000);
	w.addObjects(1, "cube", 1);
	w.bossWave = true;
	w.bossName = "Gelatinous Cube";
	engine.waves.push(w);

};
