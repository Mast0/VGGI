function CreateSurfaceData() {
    let vertexList = [];
    let normalList = [];
    let indexList = [];

    // Sliders for U and V steps
    let uStepsElem = document.getElementById('uSteps');
    let vStepsElem = document.getElementById('vSteps');
    let uSteps = uStepsElem ? parseInt(uStepsElem.value) : 36;
    let vSteps = vStepsElem ? parseInt(vStepsElem.value) : 20;

    // v ranges from -1.0 to 1.0
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

    // Helper function to evaluate analytic normal
    function evaluateNormal(uDeg, v) {
        let u = uDeg * Math.PI / 180;
        let eps = 0.0001;
        if (v >= 1.0) v = 1.0 - eps; // Avoid division by zero

        let r = v * v * Math.sqrt(1 - v);
        // dr/dv = 2v * sqrt(1-v) - v^2 / (2 * sqrt(1-v))
        let dr_dv = 2 * v * Math.sqrt(1 - v) - (v * v) / (2 * Math.sqrt(1 - v));

        // N = (-r * sin(u), r * cos(u), 0) x (dr_dv * cos(u), dr_dv * sin(u), 1)
        // N = (r * cos(u), r * sin(u), -r * dr_dv)
        let nx = r * Math.cos(u);
        let ny = r * Math.sin(u);
        let nz = -r * dr_dv;

        let len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (len === 0) return [0, 0, 1]; // Fallback
        return [nx / len, ny / len, nz / len];
    }

    // Generate vertices and normals
    for (let i = 0; i <= uSteps; i++) {
        let u = i * (360 / uSteps);
        for (let j = 0; j <= vSteps; j++) {
            let v = vMin + j * (vMax - vMin) / vSteps;

            let p = evaluate(u, v);
            let n = evaluateNormal(u, v);

            vertexList.push(...p);
            normalList.push(...n);
        }
    }

    // Generate indices for triangles
    for (let i = 0; i < uSteps; i++) {
        for (let j = 0; j < vSteps; j++) {
            let p1 = i * (vSteps + 1) + j;
            let p2 = p1 + 1;
            let p3 = (i + 1) * (vSteps + 1) + j;
            let p4 = p3 + 1;

            // CCW triangles
            indexList.push(p1, p3, p2);
            indexList.push(p2, p3, p4);
        }
    }

    return {
        vertices: vertexList,
        normals: normalList,
        indices: indexList
    };
}

function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (data) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);

        this.count = data.indices.length;
    }

    this.Draw = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
}
