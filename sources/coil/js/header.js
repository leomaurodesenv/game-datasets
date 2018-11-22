/**
 * Controls the showing and hiding of the expandable
 * header.
 * 
 * @author Hakim El Hattab / http://hakim.se
 */
window.onload = function() {
	
	var header = document.getElementsByTagName('header')[0];
	var headerToggleTimeOut = -1;
	var headerMouseDown = false;
	
	document.addEventListener( 'mousedown', function() {
		headerMouseDown = true;
	}, false );
	
	document.addEventListener( 'mouseup', function() {
		headerMouseDown = false;
	}, false );
	
	header.addEventListener('mouseover', function() {
		if (!headerMouseDown) {
			// Make sure no previous call to toggle the header are
			// queued up
			clearTimeout( headerToggleTimeOut );
			
			// Avoid accidentally opening the header by setting
			// a short time out
			headerToggleTimeOut = setTimeout( function() {
				header.setAttribute( 'class', 'open' )
			}, 100 );
		}
	}, false);
	
	header.addEventListener('mouseout', function() {
		// Make sure no previous call to toggle the header are
		// queued up
		clearTimeout( headerToggleTimeOut );
		
		// Avoid accidentally closing the header by setting
		// a short time out
		headerToggleTimeOut = setTimeout( function() {
			header.setAttribute( 'class', '' )
		}, 100 );
	}, false);
	
};
