// Parametric 3D Dragon Model for 3D Printing
// Created for azure-blog project
// A simple but recognizable dragon shape optimized for 3D printing

// Parameters
dragon_scale = 1.0;    // Overall scale factor
body_length = 80;      // Main body length
body_width = 25;       // Main body width
body_height = 20;      // Main body height
head_size = 18;        // Dragon head size
tail_length = 60;      // Tail length
wing_span = 70;        // Wing span
leg_height = 15;       // Leg height
horn_length = 8;       // Horn length
print_resolution = 32; // Circle resolution for printing

// Main dragon module
module dragon() {
    // Main body (ellipsoid)
    translate([0, 0, leg_height]) {
        scale([body_length/20, body_width/20, body_height/20]) {
            sphere(r=10, $fn=print_resolution);
        }
    }
    
    // Dragon head
    translate([body_length/2 + head_size/2, 0, leg_height + body_height/3]) {
        dragon_head();
    }
    
    // Dragon tail
    translate([-body_length/2, 0, leg_height + body_height/4]) {
        dragon_tail();
    }
    
    // Wings
    translate([0, 0, leg_height + body_height/2]) {
        dragon_wings();
    }
    
    // Legs
    dragon_legs();
    
    // Spinal ridges
    dragon_spines();
}

// Dragon head module
module dragon_head() {
    // Main head
    scale([1.2, 0.8, 0.9]) {
        sphere(r=head_size/2, $fn=print_resolution);
    }
    
    // Snout
    translate([head_size/3, 0, -head_size/6]) {
        scale([1.5, 0.6, 0.5]) {
            sphere(r=head_size/4, $fn=print_resolution);
        }
    }
    
    // Horns
    translate([0, -head_size/4, head_size/3]) {
        rotate([0, 30, 0]) {
            cylinder(h=horn_length, r1=2, r2=0.5, $fn=print_resolution/2);
        }
    }
    translate([0, head_size/4, head_size/3]) {
        rotate([0, 30, 0]) {
            cylinder(h=horn_length, r1=2, r2=0.5, $fn=print_resolution/2);
        }
    }
    
    // Eyes (small spheres)
    translate([head_size/4, -head_size/4, head_size/6]) {
        sphere(r=2, $fn=print_resolution/2);
    }
    translate([head_size/4, head_size/4, head_size/6]) {
        sphere(r=2, $fn=print_resolution/2);
    }
}

// Dragon tail module
module dragon_tail() {
    // Tapered tail segments
    for(i = [0:5]) {
        translate([-i*8, 0, sin(i*20)*3]) {
            scale([1, 1, 0.8 - i*0.1]) {
                sphere(r=body_width/2 - i*2, $fn=print_resolution);
            }
        }
    }
    
    // Tail spikes
    for(i = [1:4]) {
        translate([-i*8, 0, sin(i*20)*3 + body_width/2 - i*2]) {
            cylinder(h=6-i, r1=1.5, r2=0.2, $fn=print_resolution/2);
        }
    }
}

// Dragon wings module
module dragon_wings() {
    // Left wing
    translate([0, body_width/2, 0]) {
        dragon_wing();
    }
    
    // Right wing
    translate([0, -body_width/2, 0]) {
        mirror([0, 1, 0]) {
            dragon_wing();
        }
    }
}

// Single wing module
module dragon_wing() {
    // Wing membrane (simplified for printing)
    hull() {
        // Wing base
        translate([0, 0, 0]) {
            sphere(r=3, $fn=print_resolution/2);
        }
        // Wing tip
        translate([wing_span/3, wing_span/2, wing_span/4]) {
            sphere(r=1, $fn=print_resolution/2);
        }
        // Wing back point
        translate([-wing_span/4, wing_span/3, 0]) {
            sphere(r=1, $fn=print_resolution/2);
        }
    }
    
    // Wing support struts
    translate([wing_span/6, wing_span/4, wing_span/8]) {
        rotate([0, 45, 30]) {
            cylinder(h=wing_span/3, r=0.8, $fn=print_resolution/4);
        }
    }
}

// Dragon legs module
module dragon_legs() {
    // Front legs
    translate([body_length/4, body_width/3, 0]) {
        dragon_leg();
    }
    translate([body_length/4, -body_width/3, 0]) {
        dragon_leg();
    }
    
    // Back legs
    translate([-body_length/4, body_width/3, 0]) {
        dragon_leg();
    }
    translate([-body_length/4, -body_width/3, 0]) {
        dragon_leg();
    }
}

// Single leg module
module dragon_leg() {
    // Upper leg
    translate([0, 0, leg_height*0.7]) {
        cylinder(h=leg_height*0.6, r=3, $fn=print_resolution/2);
    }
    
    // Lower leg
    translate([3, 0, leg_height*0.3]) {
        cylinder(h=leg_height*0.4, r=2, $fn=print_resolution/2);
    }
    
    // Foot
    translate([5, 0, 0]) {
        scale([2, 1.5, 0.5]) {
            sphere(r=3, $fn=print_resolution/2);
        }
    }
    
    // Claws
    for(angle = [-30, 0, 30]) {
        translate([7, 0, 1]) {
            rotate([0, -20, angle]) {
                cylinder(h=4, r1=0.8, r2=0.1, $fn=print_resolution/4);
            }
        }
    }
}

// Spinal ridges module
module dragon_spines() {
    for(i = [0:5]) {
        translate([-body_length/3 + i*body_length/6, 0, leg_height + body_height]) {
            cylinder(h=5-i*0.5, r1=1.5, r2=0.3, $fn=print_resolution/4);
        }
    }
}

// Generate the dragon
scale([dragon_scale, dragon_scale, dragon_scale]) {
    dragon();
}