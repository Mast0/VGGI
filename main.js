'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

function deg2rad(angle) {
    return angle * Math.PI / 180;
}

// Constructor
function ShaderProgram(name, program) {
    this.name = name;
    this.prog = program;

    // Location of the attribute variables in the shader program.
    this.iAttribVertex = -1;
    this.iAttribNormal = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrices
    this.iModelViewMatrix = -1;
    this.iProjectionMatrix = -1;
    this.iNormalMatrix = -1;
    this.iLightPosEye = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}

function draw() { 
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI/8, 1, 8, 12); 
    
    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    let translateToPointZero = m4.translation(0,0,-10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView );
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0 );
        
    /* Send matrices to the shader program */
    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum1 );
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projection );
    
    // Normal matrix: inverse transpose of top-left 3x3 of ModelView
    // As matAccum1 is just rotation and translation, we can extract the 3x3 part directly.
    let normalMatrix = [
        matAccum1[0], matAccum1[1], matAccum1[2],
        matAccum1[4], matAccum1[5], matAccum1[6],
        matAccum1[8], matAccum1[9], matAccum1[10]
    ];
    gl.uniformMatrix3fv(shProgram.iNormalMatrix, false, normalMatrix);

    // Light source
    let time = Date.now() * 0.001;
    let radius = 2.0;
    let lightWorld = [
        radius * Math.cos(time), 
        radius * Math.sin(time), 
        1.0
    ];
    let lightPosEye = m4.transformPoint(matAccum1, lightWorld);
    gl.uniform3fv(shProgram.iLightPosEye, lightPosEye);

    // Surface color
    gl.uniform4fv(shProgram.iColor, [0.0, 1.0, 0.5, 1.0] );

    surface.Draw();
}

function updateSurface() {
    let uSteps = document.getElementById('uSteps').value;
    let vSteps = document.getElementById('vSteps').value;
    document.getElementById('uStepsValue').innerText = uSteps;
    document.getElementById('vStepsValue').innerText = vSteps;
    surface.BufferData(CreateSurfaceData());
}

function initGL() {
    let prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex              = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal              = gl.getAttribLocation(prog, "normal");
    shProgram.iModelViewMatrix           = gl.getUniformLocation(prog, "ModelViewMatrix");
    shProgram.iProjectionMatrix          = gl.getUniformLocation(prog, "ProjectionMatrix");
    shProgram.iNormalMatrix              = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iColor                     = gl.getUniformLocation(prog, "color");
    shProgram.iLightPosEye               = gl.getUniformLocation(prog, "lightPosEye");

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());

    gl.enable(gl.DEPTH_TEST);
}

function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vShader);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
     }
    let fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
       throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, null, 0);

    animate();
}

function animate() {
    draw();
    window.requestAnimationFrame(animate);
}
