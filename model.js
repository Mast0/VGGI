function CreateSurfaceData() {
    let vertexList = [];
    
    let a = 1;
    let uSteps = 36;
    let vSteps = 20;

    // v ranges from -1.5 to 1
    let vMin = -1.0;
    let vMax = 1.0;

    // Helper function to evaluate the surface
    function evaluate(uDeg, v) {
        let u = uDeg * Math.PI / 180;
        let r = v * v * Math.sqrt(1 - v);
        let x = r * Math.cos(u);
        let y = r * Math.sin(u);
        let z = v;
        return [x, y, z];
    }

    // U polylines (constant U, varying V)
    for (let i = 0; i < uSteps; i++) {
        let u = i * (360 / uSteps);
        for (let j = 0; j < vSteps; j++) {
            let v1 = vMin + j * (vMax - vMin) / vSteps;
            let v2 = vMin + (j + 1) * (vMax - vMin) / vSteps;
            
            let p1 = evaluate(u, v1);
            let p2 = evaluate(u, v2);

            vertexList.push(...p1);
            vertexList.push(...p2);
        }
    }

    // V polylines (constant V, varying U)
    for (let j = 0; j <= vSteps; j++) {
        let v = vMin + j * (vMax - vMin) / vSteps;
        for (let i = 0; i < uSteps; i++) {
            let u1 = i * (360 / uSteps);
            let u2 = (i + 1) * (360 / uSteps);
            
            let p1 = evaluate(u1, v);
            let p2 = evaluate(u2, v);

            vertexList.push(...p1);
            vertexList.push(...p2);
        }
    }

    return vertexList;
}

function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.count = vertices.length / 3;
    }

    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
   
        gl.drawArrays(gl.LINES, 0, this.count);
    }
}
