(function define_horde_SpawnWave () {

horde.SpawnWave = function horde_SpawnWave () {
	this.points = [];
	this.nextWaveTime = 20000; // 20 seconds
	this.bossWave = false;
};

var proto = horde.SpawnWave.prototype;

proto.addSpawnPoint = function horde_SpawnWave_proto_addSpawnPoint (index, spawnDelay) {
	this.points.push({
		spawnPointId: index,
		delay: spawnDelay,
		objects: []
	});
};

proto.addObjects = function horde_SpawnWave_proto_addObjects (id, objType, objCount) {
	var pt = null;
	for (var x in this.points) {
		if (this.points[x].spawnPointId === id) {
			pt = this.points[x];
		}
	}
	if (pt === null) {
		return false;
	}
	pt.objects.push({
		type: objType,
		count: Math.floor(objCount)
	});
};

}());
