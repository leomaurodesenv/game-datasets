/**
	Base class for all drawable objects, makes ordering automatic.
	Code by Rob Kleffner, 2011
*/

Enjine.Drawable = function() {
    this.ZOrder = 0;
};

Enjine.Drawable.prototype = {
    Draw: function(context) { }
};