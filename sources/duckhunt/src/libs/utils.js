module.exports.pointDistance = function(point1, point2) {
  return Math.sqrt(
    (Math.pow((point1.x - point2.x), 2) + Math.pow((point1.y - point2.y), 2))
  );
};

module.exports.directionOfTravel = function(pointStart, pointEnd) {
  let direction = '';

  //positive means down
  const rise = pointEnd.y - pointStart.y;
  //positive means right
  const run = pointEnd.x - pointStart.x;

  if (run < 1 && rise < 1) {
    direction = 'top-left';
  } else if (run < 1 && rise > 1) {
    direction = 'bottom-left';
  } else if (run > 1 && rise < 1) {
    direction = 'top-right';
  } else if (run > 1 && rise > 1) {
    direction = 'bottom-right';
  }

  if (run !== 0 && Math.abs(rise/run) < 0.3) {
    if (run > 1) {
      direction = 'right';
    } else {
      direction = 'left';
    }
  }

  return direction;
};