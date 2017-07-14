// *******************************************************
// CS 174a Graphics Example Code
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.  

// Now go down to display() to see where the sample shapes are drawn, and to see where to fill in your own code.

"use strict"
var canvas, canvas_size, gl = null, g_addrs,
	movement = vec2(),	thrust = vec3(), 	looking = false, prev_time = 0, animate = false, animation_time = 0;
		var gouraud = false, color_normals = false, solid = false;

		
// *******************************************************	
// When the web page's window loads it creates an Animation object, which registers itself as a displayable object to our other class GL_Context -- which OpenGL is told to call upon every time a
// draw / keyboard / mouse event happens.

window.onload = function init() {	var anim = new Animation();	}
function Animation()
{
	( function init (self) 
	{
		self.context = new GL_Context( "gl-canvas" );
		self.context.register_display_object( self );
		
		gl.clearColor( 0, 0, .2, 1 );			// Background color

		self.m_comet_tail =  new comet_tail();
		self.m_pyramid_lantern = new pyramid_lantern();
		self.m_dome_lantern = new dome_lantern();		
		self.m_box_lantern = new box_lantern();
		//self.m_flame = new flame();
		self.m_cube = new cube();
		//self.m_obj = new shape_from_file( "teapot.obj" )
		//self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 4 );	
		//self.m_fan = new triangle_fan_full( 10, mat4() );
		self.m_strip = new rectangular_strip( 3, mat4() );
		//self.m_cylinder = new cylindrical_strip( 10, mat4() );
		self.m_tile = new tile();

		self.camera_transform = translate(0, 0,-100);
		self.camera_transform = mult(self.camera_transform, rotate(20, 1, 0, 0));
		//self.camera_transform = mult(self.camera_transform, rotate(180, 0, 1, 0));
		//	self.camera_transform = mult(self.camera_transform, rotate(180, 0, 1, 0));
			
		self.projection_transform = perspective(45, canvas.width/canvas.height, .1, 1000);		// The matrix that determines how depth is treated.  It projects 3D points onto a plane.
		
		gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);		gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);		gl.uniform1i( g_addrs.SOLID_loc, solid);
		
		self.animation_time = 0
		self.context.render();	
	} ) ( this );	
	
	canvas.addEventListener('mousemove', function(e)	{		e = e || window.event;		movement = vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2, 0);	});
}

// *******************************************************	
// init_keys():  Define any extra keyboard shortcuts here
Animation.prototype.init_keys = function()
{
	//shortcut.add( "Space", function() { thrust[1] = -1; } );			shortcut.add( "Space", function() { thrust[1] =  0; }, {'type':'keyup'} );
	//shortcut.add( "z",     function() { thrust[1] =  1; } );			shortcut.add( "z",     function() { thrust[1] =  0; }, {'type':'keyup'} );
	//shortcut.add( "w",     function() { thrust[2] =  1; } );			shortcut.add( "w",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	//shortcut.add( "a",     function() { thrust[0] =  1; } );			shortcut.add( "a",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	//shortcut.add( "s",     function() { thrust[2] = -1; } );			shortcut.add( "s",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	//shortcut.add( "d",     function() { thrust[0] = -1; } );			shortcut.add( "d",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	//shortcut.add( "f",     function() { looking = !looking; } );
	//shortcut.add( ",",     ( function(self) { return function() { self.camera_transform = mult( rotate( 3, 0, 0,  1 ), self.camera_transform ); }; } ) (this) ) ;
	//shortcut.add( ".",     ( function(self) { return function() { self.camera_transform = mult( rotate( 3, 0, 0, -1 ), self.camera_transform ); }; } ) (this) ) ;

	//shortcut.add( "r",     ( function(self) { return function() { self.camera_transform = mat4(); }; } ) (this) );
	shortcut.add( "ALT+s", function() { solid = !solid;					gl.uniform1i( g_addrs.SOLID_loc, solid);	
																		gl.uniform4fv( g_addrs.SOLID_COLOR_loc, vec4(Math.random(), Math.random(), Math.random(), 1) );	 } );
	//shortcut.add( "ALT+g", function() { gouraud = !gouraud;				gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);	} );
	shortcut.add( "ALT+n", function() { color_normals = !color_normals;	gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);	} );
	//shortcut.add( "ALT+a", function() { animate = !animate; } );
	
	//shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
	//shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );	
}
function update_camera( self, animation_delta_time )
	{
		var leeway = 70, border = 50;
		var degrees_per_frame = .0005 * animation_delta_time;
		var meters_per_frame  = .03 * animation_delta_time;
																					// Determine camera rotation movement first
		var movement_plus  = [ movement[0] + leeway, movement[1] + leeway ];		// movement[] is mouse position relative to canvas center; leeway is a tolerance from the center.
		var movement_minus = [ movement[0] - leeway, movement[1] - leeway ];
		var outside_border = false;
		
		for( var i = 0; i < 2; i++ )
			if ( Math.abs( movement[i] ) > canvas_size[i]/2 - border )	outside_border = true;		// Stop steering if we're on the outer edge of the canvas.

		for( var i = 0; looking && outside_border == false && i < 2; i++ )			// Steer according to "movement" vector, but don't start increasing until outside a leeway window from the center.
		{
			var velocity = ( ( movement_minus[i] > 0 && movement_minus[i] ) || ( movement_plus[i] < 0 && movement_plus[i] ) ) * degrees_per_frame;	// Use movement's quantity unless the &&'s zero it out
			self.camera_transform = mult( rotate( velocity, i, 1-i, 0 ), self.camera_transform );			// On X step, rotate around Y axis, and vice versa.
		}
		self.camera_transform = mult( translate( scale_vec( meters_per_frame, thrust ) ), self.camera_transform );		// Now translation movement of camera, applied in local camera coordinate frame
	}

// *******************************************************	
// display(): called once per frame, whenever OpenGL decides it's time to redraw.

Animation.prototype.draw_star = function(x,y){
	var model_transform = mat4();
	model_transform = mult(model_transform, translate( x, y, -125 ));
	model_transform = mult(model_transform, scale( .2, .2, .2 ));
	this.m_tile.draw( model_transform, this.camera_transform, this.projection_transform, "white.png", 1 );		
}

Animation.prototype.draw_flame = function(x, y, z, scale_x, scale_y, scale_z, material, time){
		var flame_transform = mat4();
		flame_transform = mult( flame_transform, translate(x, y, z));
		flame_transform = mult( flame_transform, scale(scale_x, scale_y, scale_z));
		this.m_sphere.draw( flame_transform, this.camera_transform, this.projection_transform, material, 1);		
}

Animation.prototype.draw_lantern = function(x, y, z, size, material, type, time){
		
		var rotation = 0;
		var y1 = 0;
		var y2 = 0;
		var y3 = 0;
		var y4 = 0;
		
		if( time > 60000)
		{
			y1 = time * .00025 - 15;
			y2 = time * .000325 -19.5;
			y3 = time * .0003 - 18;
			y4 = time * .00015 - 9;
		}
		
		if( time > 59000)
		{
			rotation = time * .01;
		}
		
		var model_transform = mat4();
		model_transform = mult( model_transform, translate( x, y, z ) );	
		model_transform = mult( model_transform, rotate( rotation, 0, 1, 0 ) );	
		model_transform = mult( model_transform, scale( size, size, size ) );
		

		
		switch (material){
			case 0:
				model_transform = mult(model_transform, translate(0, y1, 0));				
				material = "sun2.png";				
				break;

			case 1:
				model_transform = mult(model_transform, translate(0, y2, 0));				
				material = "turquoise_material.png";				
				break;
				
			case 2:
				model_transform = mult(model_transform, translate(0, y3, 0));							
				material = "blue_material.png";				
				break;

			case 3:
				model_transform = mult(model_transform, translate(0, y4, 0));							
				material = "red.png";
				break;
		}

		switch (type){
			case 0:
				this.m_box_lantern.draw( model_transform, this.camera_transform, this.projection_transform, material, time );				
				break;

			case 1:
				this.m_dome_lantern.draw( model_transform, this.camera_transform, this.projection_transform, material, time );				
				break;
				
			case 2:
				this.m_pyramid_lantern.draw( model_transform, this.camera_transform, this.projection_transform, material, time );
				break;
		}		
}

Animation.prototype.draw_fly = function(movement, rotation, size, material, time){
	
		var fly1 = mat4();
		
		fly1 = mult(fly1, movement);
		fly1 = mult( fly1, rotate(rotation, 0, 1, 0));		
		fly1 = mult( fly1, scale(size, size, size));
		
		//butt
		var fly1_butt = mult( fly1, scale(2, 1, 1));
		fly1_butt = mult( fly1_butt, translate(-2.5, 0, 0));
		this.m_sphere.draw(fly1_butt, this.camera_transform, this.projection_transform, material, 1 );

		//thorax
		var fly1_body = mult( fly1, scale(1.5, 1, 1));
		fly1_body = mult( fly1_body, translate(-1.5, 0, 0));
		this.m_sphere.draw(fly1_body, this.camera_transform, this.projection_transform, material, time );
		
		//head
		this.m_sphere.draw(fly1, this.camera_transform, this.projection_transform, material, time );
		
		//anttenae 
		var fly1_attenae_movement = mult(fly1, rotate(25 * Math.sin( time * .005), 0, 1, 0));
		
		var fly1_attenae = mult( fly1_attenae_movement, translate(0, 1, 0));
		fly1_attenae = mult(fly1_attenae, scale(.25, 2, .25));
		this.m_cube.draw(fly1_attenae, this.camera_transform, this.projection_transform, material, time );

		var fly1_attenae2 = mult(fly1_attenae_movement, translate(0, 2, 0));
		fly1_attenae2 = mult( fly1_attenae2, rotate (-45, 0, 0, 1));
		fly1_attenae2 = mult( fly1_attenae2, translate (0, 1, 0));
		fly1_attenae2 = mult(fly1_attenae2, scale(.25, 2, .25));
		this.m_cube.draw(fly1_attenae2, this.camera_transform, this.projection_transform, material, time );

		var fly1_attenae2 = mult(fly1_attenae_movement, translate(1.4, 3.25, 0));
		fly1_attenae2 = mult( fly1_attenae2, rotate (-135, 0, 0, 1));
		fly1_attenae2 = mult( fly1_attenae2, rotate (25 * Math.sin( time * .001), 0, 0, 1));
		fly1_attenae2 = mult( fly1_attenae2, translate(0, 1, 0));
		fly1_attenae2 = mult(fly1_attenae2, scale(.25, 2, .25));
		this.m_cube.draw(fly1_attenae2, this.camera_transform, this.projection_transform, material, time );
		
		var fly1_attenae_ball = mult(fly1_attenae_movement, translate(1.5, 3, 0));
		fly1_attenae_ball = mult( fly1_attenae_ball, rotate (25 * Math.sin( time * .001), 0, 0, 1));
		fly1_attenae_ball = mult( fly1_attenae_ball, translate(1.25, -1, 0));
		fly1_attenae_ball = mult( fly1_attenae_ball, scale(.75, .75, .75));
		this.m_sphere.draw(fly1_attenae_ball, this.camera_transform, this.projection_transform, material, 1 );

		//wings
		var wing_angle = -Math.abs(90 * Math.sin(time * .01));
		var fly1_wing = fly1;
		fly1_wing = mult( fly1_wing, translate(-2, 0, 1.5));		
	    fly1_wing = mult(fly1_wing, rotate(wing_angle, 1, 0, 0));
		fly1_wing = mult( fly1_wing, translate(0, 0, 4));
		fly1_wing = mult(fly1_wing, scale(1, .1, 4));
		this.m_sphere.draw(fly1_wing, this.camera_transform, this.projection_transform, "blue_material.png", time )

		var fly1_wing2 = fly1;
		fly1_wing2 = mult( fly1_wing2, translate(-2, 0, -1.5));		
	    fly1_wing2 = mult(fly1_wing2, rotate(-wing_angle, 1, 0, 0));
		fly1_wing2 = mult( fly1_wing2, translate(0, 0, -4));
		fly1_wing2 = mult(fly1_wing2, scale(1, .1, 4));
		this.m_sphere.draw(fly1_wing2, this.camera_transform, this.projection_transform, "blue_material.png", time )
}

Animation.prototype.draw_comet_tail = function(scale_x, scale_y, scale_z, rotate_x, rotate_y, rotate_z, comet_transform, material, time){
		var comet_t1_transform = mat4();
		comet_t1_transform = mult( comet_t1_transform, comet_transform);
		comet_t1_transform = mult( comet_t1_transform, rotate(rotate_x, 1, 0, 0 ));
		comet_t1_transform = mult( comet_t1_transform, rotate(rotate_y, 0, 1, 0 ));		
		comet_t1_transform = mult( comet_t1_transform, rotate(rotate_x, 0, 0, 1 ));
		comet_t1_transform = mult( comet_t1_transform, scale(scale_x, scale_y, scale_z));
		this.m_comet_tail.draw(comet_t1_transform, this.camera_transform, this.projection_transform, material, time);		
}
		
Animation.prototype.draw_comet = function(scale_x, scale_y, scale_z, rotate_x, rotate_y, rotate_z, comet_transform, material, time){

		var comet_t1_transform = mat4();
		comet_t1_transform = mult( comet_t1_transform, comet_transform);
		comet_t1_transform = mult( comet_t1_transform, rotate(rotate_x, 1, 0, 0 ));
		comet_t1_transform = mult( comet_t1_transform, rotate(rotate_y, 0, 1, 0 ));		
		comet_t1_transform = mult( comet_t1_transform, rotate(rotate_x, 0, 0, 1 ));
		comet_t1_transform = mult( comet_t1_transform, scale(scale_x, scale_y, scale_z));

		for (var i = 0; i < 7; i++){ 
			this.draw_comet_tail(2, 1.5, 2, i*25,i*25,i*25, comet_transform, material, time);
		}

		this.draw_comet_tail(1, 3.5, 1, 80, 0, 80, comet_transform, material, time );		
		this.draw_comet_tail(1, 7, 1, 90, 0, 90, comet_transform, material, time);
		this.draw_comet_tail(1, 4.5, 1, 100, 0, 100, comet_transform, material, time);
		this.draw_comet_tail(1, 4, 1, 90, 10, 90, comet_transform, material, time);
		
		/*
		var comet_dc_transform = mat4();
		comet_dc_transform = mult( comet_dc_transform, translate(Math.random()*10, Math.random()*5, Math.random()*10 ) );
		comet_dc_transform = mult( comet_dc_transform, comet_transform );
		comet_dc_transform = mult( comet_dc_transform, scale(.25, .25, .25) );
		this.m_sphere.draw(comet_dc_transform, this.camera_transform, this.projection_transform, material, 1);	

		var comet_dc_transform = mat4();
		comet_dc_transform = mult( comet_dc_transform, translate(Math.random()*10, Math.random()*5, Math.random()*10) );
		comet_dc_transform = mult( comet_dc_transform, comet_transform );
		comet_dc_transform = mult( comet_dc_transform, scale(.25, .25, .25) );
		this.m_sphere.draw(comet_dc_transform, this.camera_transform, this.projection_transform, material, 1);	*/
		
		var comet_center_transform = mat4();
		comet_center_transform = mult( comet_center_transform, comet_transform);
		comet_center_transform = mult( comet_center_transform, scale(3, 3, 3));
		this.m_sphere.draw(comet_center_transform, this.camera_transform, this.projection_transform, material, time);	
		
}

Animation.prototype.display = function(time)
	{
		if(!time) time = 0;
		this.animation_delta_time = time - prev_time;
		if(animate) this.animation_time += this.animation_delta_time;
		prev_time = time;
		
		update_camera( this, this.animation_delta_time );
			
		var basis_id = 0;
		
		var model_transform = mat4();
		
	
		this.camera_transform = lookAt(vec3(0, 30, 100 ), vec3(0,0,0), vec3(0,1,0) );		
		
		if( time > 30000){
			this.camera_transform = lookAt(vec3(0, 30, 160 - time * .002), vec3(0, 0, 0), vec3(0,1,0) );
		}
		
		if( time > 40000){
			this.camera_transform = lookAt(vec3(0, 110 - time * .002, 80 ), vec3(0,0,0), vec3(0,1,0) );					
		}

		if( time > 54000){
			this.camera_transform = lookAt(vec3(0, 2, 80), vec3(0, -54 + time * .001,0), vec3(0,1,0) );
		}

		if( time > 75000){
			this.camera_transform = lookAt(vec3(0, 2, 80), vec3(0, 21, 0), vec3(0,1,0) );
		}
	
		/**********************************
		Start coding here!!!!
		**********************************/		
		// Flame		
		gl.uniform4fv( g_addrs.color_loc, vec4( .15, .15, .15, 1 ) );
		
	
		//FLAME
		
		
		if( time > 25000)
		{
			gl.uniform4fv( g_addrs.color_loc, vec4( 1, 0, 0, 1 ) );	
		}	
		this.draw_flame(-40, 10, -40, 2, 2, 2, "");
		gl.uniform4fv( g_addrs.color_loc, vec4( .15, .15, .15, 1 ) );	
		model_transform = mult( model_transform, translate (-40, 0, -40));
		model_transform = mult(model_transform, scale(.5, 20, .5));
		this.m_cube.draw(model_transform, this.camera_transform, this.projection_transform, "", time);
		
		gl.uniform4fv( g_addrs.color_loc, vec4( .15, .15, .15, 1 ) );

		if( time > 26000)
		{
			gl.uniform4fv( g_addrs.color_loc, vec4( 1, 1, 0, 1 ) );
		}
		this.draw_flame(40, 10, -40, 2, 2, 2, "");
		gl.uniform4fv( g_addrs.color_loc, vec4( .15, .15, .15, 1 ) );		
		model_transform = mult( model_transform, translate (160, 0, 0));
		this.m_cube.draw(model_transform, this.camera_transform, this.projection_transform, "", time);

		if( time > 27000)
		{
			gl.uniform4fv( g_addrs.color_loc, vec4( 0, 1, 0, 1 ) );
		}
		this.draw_flame(35, 10, 35, 2, 2, 2, "");
		gl.uniform4fv( g_addrs.color_loc, vec4( .15, .15, .15, 1 ) );		
		model_transform = mult( model_transform, translate (-10, 0, 150));
		this.m_cube.draw(model_transform, this.camera_transform, this.projection_transform, "", time);

		if( time > 28000)
		{
			gl.uniform4fv( g_addrs.color_loc, vec4( 0, 0, 1, 1 ) );
		}
		this.draw_flame(-35, 10, 35, 2, 2, 2, "");
		gl.uniform4fv( g_addrs.color_loc, vec4( .15, .15, .15, 1 ) );	
		model_transform = mult( model_transform, translate (-140, 0, 0));
		this.m_cube.draw(model_transform, this.camera_transform, this.projection_transform, "", time);

		gl.uniform4fv( g_addrs.color_loc, vec4( 1, 1, 1, 1 ) );
		
		if (time > 55500){
			this.draw_star(-40, 25);
			this.draw_star(-62, 48);
			this.draw_star(-32, 28);
			this.draw_star(-100, 35);
			this.draw_star(-116, 55);
			this.draw_star(90, 38);
			this.draw_star(63, 35);
			this.draw_star(41, 65);
			this.draw_star(0, 55);
			this.draw_star(32, 8);
			this.draw_star(60, 25);
			this.draw_star(106, 65);
			this.draw_star(-106, 70);
		}		
		
		gl.uniform4fv( g_addrs.color_loc, vec4( 1, 1, 1, 1 ) );		
		//pillars
		for (var i = 6; i < 35; i++) {			
			model_transform = mat4();
			model_transform = mult(model_transform, translate(-Math.sin(i) * i * 1.5, -5, -Math.cos(i) * i * 1.5));
			model_transform = mult( model_transform, scale( 2, 10, 2 ) );				
			this.m_cube.draw(model_transform, this.camera_transform, this.projection_transform, "blue_material.png", time);
		}

		for (var i = 6; i < 45; i++) {			
			model_transform = mat4();
			model_transform = mult(model_transform, translate(Math.sin(i) * i * 1.5, -5, -Math.cos(i)*i * 1.5));
			model_transform = mult( model_transform, scale( 2, 10, 2 ) );				
			this.m_cube.draw(model_transform, this.camera_transform, this.projection_transform, "blue_material.png", time);
		}

		gl.uniform4fv( g_addrs.color_loc, vec4( 0, .5, .5, 1 ) );

		// GROUND 
		
		var ground = "sun2.png";
		
		for (var i = -4; i < 4; i++) {			
			for (var j = -4; j < 7; j++) {			
				model_transform = mat4();
				model_transform = mult( model_transform, rotate(270, 0, 0, 1));
				model_transform = mult(model_transform, translate(10, i*17, j*13 - 20));
				model_transform = mult( model_transform, scale( 1, 16, 4 ) );				
				this.m_strip.draw(model_transform, this.camera_transform, this.projection_transform, ground, time);
			}
		}		

		gl.uniform4fv( g_addrs.color_loc, vec4( 0, 0, 0, 1 ) );
		model_transform = mat4();
		model_transform = mult( model_transform, rotate(270, 0, 0, 1));
		model_transform = mult( model_transform, rotate(90, 1, 0, 0));
		model_transform = mult(model_transform, translate(11, -8, 8.5));
		model_transform = mult( model_transform, scale( 1, 156, 47 ) );				
		this.m_strip.draw(model_transform, this.camera_transform, this.projection_transform, "", time);

		gl.uniform4fv( g_addrs.color_loc, vec4( 1, 1, 1, 1 ) );
		
		//flies 
		var x_move1 = Math.sin(time *.0002) * 50 + Math.sin(time *.003);
		var y_move1 = -5 + Math.sin(time *.001) * 2;
		var z_move1 = Math.cos(time *.0002) * 50 + Math.sin(time *.003);

		var x_move2 = Math.sin(time *.0002) * 25 + Math.sin(time *.003);
		var y_move2 = -5 + Math.sin(time *.001) * 2.5;
		var z_move2 = Math.cos(time *.0002) * 25 + Math.sin(time *.003);
		
		if( time > 65000)
		{
			y_move1 = -59.5 + time * .0009 + Math.sin(time *.001) * 2;
			y_move2 = -61.5 + time * .0009 + Math.sin(time *.001) * 2.5;
		}
		
		var red_rotate = time*.0116;
		var red_size = .25;
		
		if( time > 115500)
		{
			y_move1 = -59.5 + 115500 * .0009 + Math.sin(115500 *.001) * 2;;
			x_move1 = Math.sin(115500 *.0002) * 50 + Math.sin(115500 *.003);
			z_move1 = Math.cos(115500 *.0002) * 50 + Math.sin(115500 *.003);
			red_rotate = 115500 * .0116;
			red_size = .25 * 115500 / time;
		}

		if( time > 29000)
		{
			var moving_transform1 = mat4();
			gl.uniform4fv( g_addrs.color_loc, vec4( 1, 0, 0, 1 ) );
			moving_transform1 = mult( moving_transform1, translate( x_move1, y_move1, z_move1 ) );
			this.draw_fly(moving_transform1, red_rotate, red_size, "", time);
		}

			/*var moving_transform2 = mat4();
			gl.uniform4fv( g_addrs.color_loc, vec4( 1, 1, 1, 1 ) );
			//gl.uniform4fv( g_addrs.color_loc, vec4( Math.sin(time * .0005), .5, 0, 1 ) );
			//moving_transform2 = mult( moving_transform2, translate( -x_move1, y_move1, -z_move1 ) );		
			this.draw_fly(moving_transform2, 0, 2, "", time);*/

		if( time > 32500)
		{
			var moving_transform3 = mat4();
			gl.uniform4fv( g_addrs.color_loc, vec4( 1, 0, 1, 1 ) );
			moving_transform3 = mult( moving_transform3, translate( x_move2, y_move2, z_move2 ) );		
			this.draw_fly(moving_transform3, time*.0115, .5, "", time);
		}

		if( time > 35000)
		{
			var moving_transform4 = mat4();
			gl.uniform4fv( g_addrs.color_loc, vec4( 0, 1, 1, 1 ) );
			moving_transform4 = mult( moving_transform4, translate( -x_move2, y_move2, -z_move2 ) );		
			this.draw_fly(moving_transform4, 180 + time*.0115, .5, "", time);
		}
		
		//3 flies follow the lanterns into the sky
				
		gl.uniform4fv( g_addrs.color_loc, vec4( 1, 1, 1, 1 ) );		
		// SUN
		var sun_transform = mat4();
		sun_transform = mult( sun_transform, translate( 0, 50 - time * .0035, -140 ) );
		sun_transform = mult( sun_transform, rotate( time *.01, 0, 1, 0 ) );	
		sun_transform = mult( sun_transform, scale(20, 20, 20));
		this.m_sphere.draw(sun_transform, this.camera_transform, this.projection_transform, "sun3.png", 1 );
		

		// MOON
		var moon_transform = mat4();
		var moon_xloc = -60 - time * .0005;
		var moon_yloc = -55 + time * .002;
		
		if (time > 80000) {
			moon_xloc = -60 - 80000 * .0005;
			moon_yloc = -55 + 80000 * .002;
		}
		
		moon_transform = mult( moon_transform, translate( moon_xloc, moon_yloc, -150 ) );
		moon_transform = mult( moon_transform, rotate( time * .01, 0, 1, 0 ) );	
		moon_transform = mult( moon_transform, scale(10, 10, 10));
		this.m_sphere.draw(moon_transform, this.camera_transform, this.projection_transform, "moon2.png", 1 );
				
		//Lanterns
		
		for (var i = 6; i < 35; i++) {			
			this.draw_lantern(-Math.sin(i)*i * 1.5, 0, -Math.cos(i)*i * 1.5, 3, i % 4, i % 3, time);
		}

		for (var i = 6; i < 42; i++) {			
			this.draw_lantern(Math.sin(i)*i * 1.5, 0, -Math.cos(i)*i * 1.5, 2, i % 4, i % 3, time);
		}

				
		// COMETS
		/*var comet_transform = mat4();
		comet_transform = mult( comet_transform, rotate( -time*.01, 0, 1, 0 ) );
		comet_transform = mult( comet_transform, translate(80, Math.sin(time*.0001)*5 + 20, 0));
		comet_transform = mult( comet_transform, rotate( -90, 0, 1, 0 ) );
		comet_transform = mult( comet_transform, rotate( time*.1, 1, 0, 0 ) );
		this.draw_comet(2, 1.5, 2, 0, 0, 0, comet_transform, "sun2.png", time);
		*/
		
		if( time > 55000)
		{
			var comet_transform3 = mat4();
			comet_transform3 = mult( comet_transform3, rotate( time*.01, 0, 1, 0 ) );
			comet_transform3 = mult( comet_transform3, translate(80, Math.cos(time*.0001)*5 + 40, 0));
			comet_transform3 = mult( comet_transform3, rotate( -90, 0, 1, 0 ) );
			comet_transform3 = mult( comet_transform3, rotate( time*.1, 1, 0, 0 ) );
			comet_transform3 = mult( comet_transform3, rotate( 180, 0, 0, 1 ) );
			this.draw_comet(2, 1.5, 2, 0, 0, 0, comet_transform3, "sun2.png", time);
		}
		
		//sky
		gl.uniform4fv( g_addrs.color_loc, vec4( .125, .5, 1, 1 ) );
		var background_transform = mat4();
	    background_transform = mult( background_transform, scale( 250, 250, 250));
		this.m_sphere.draw(background_transform, this.camera_transform, this.projection_transform, "", time);
				
	}	
	

Animation.prototype.update_strings = function( debug_screen_object )		// Strings this particular class contributes to the UI
{
//	debug_screen_object.string_map["time"] = "Time: " + this.animation_time/1000 + "s";
//	debug_screen_object.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
//	debug_screen_object.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
//	debug_screen_object.string_map["thrust"] = "Thrust: " + thrust;
	debug_screen_object.string_map["tick"] = "Frames per sec: " + 1000 / this.animation_delta_time;
}