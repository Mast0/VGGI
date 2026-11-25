function CreateSurfaceData() {
    let vertexList = [];
    let normalList = [];
    let tangentList = [];
    let texCoordList = [];
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

    // Helper function to evaluate analytic tangent along U direction
    function evaluateTangent(uDeg) {
        let u = uDeg * Math.PI / 180;
        return [-Math.sin(u), Math.cos(u), 0.0];
    }

    // Generate vertices, normals, tangents, and texture coordinates
    for (let i = 0; i <= uSteps; i++) {
        let u = i * (360 / uSteps);
        let s = (i / uSteps) * 2.0;
        for (let j = 0; j <= vSteps; j++) {
            let v = vMin + j * (vMax - vMin) / vSteps;
            let t = (j / vSteps) * 2.0;

            let p = evaluate(u, v);
            let n = evaluateNormal(u, v);
            let tg = evaluateTangent(u);

            vertexList.push(...p);
            normalList.push(...n);
            tangentList.push(...tg);
            texCoordList.push(s, t);
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
        tangents: tangentList,
        texCoords: texCoordList,
        indices: indexList
    };
}

function CreateSphereData(radius = 0.08, latBands = 12, longBands = 16) {
    let vertexList = [];
    let normalList = [];
    let tangentList = [];
    let texCoordList = [];
    let indexList = [];

    for (let lat = 0; lat <= latBands; lat++) {
        let theta = lat * Math.PI / latBands;
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= longBands; lon++) {
            let phi = lon * 2 * Math.PI / longBands;
            let sinPhi = Math.sin(phi);
            let cosPhi = Math.cos(phi);

            let nx = cosPhi * sinTheta;
            let ny = cosTheta;
            let nz = sinPhi * sinTheta;

            normalList.push(nx, ny, nz);
            tangentList.push(-sinPhi, 0, cosPhi);
            texCoordList.push(lon / longBands, lat / latBands);
            vertexList.push(radius * nx, radius * ny, radius * nz);
        }
    }

    for (let lat = 0; lat < latBands; lat++) {
        for (let lon = 0; lon < longBands; lon++) {
            let first = lat * (longBands + 1) + lon;
            let second = first + longBands + 1;

            indexList.push(first, second, first + 1);
            indexList.push(second, second + 1, first + 1);
        }
    }

    return {
        vertices: vertexList,
        normals: normalList,
        tangents: tangentList,
        texCoords: texCoordList,
        indices: indexList
    };
}

function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTangentBuffer = gl.createBuffer();
    this.iTexCoordsBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;

    // Texture identifiers
    this.idTextureDiffuse = null;
    this.idTextureSpecular = null;
    this.idTextureNormal = null;

    this.BufferData = function (data) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTangentBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.tangents), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.texCoords), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);

        this.count = data.indices.length;
    }

    this.Draw = function () {
        if (this.idTextureDiffuse) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.idTextureDiffuse);
        }
        if (this.idTextureSpecular) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.idTextureSpecular);
        }
        if (this.idTextureNormal) {
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this.idTextureNormal);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        if (shProgram.iAttribNormal >= 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
            gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shProgram.iAttribNormal);
        }

        if (shProgram.iAttribTangent >= 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.iTangentBuffer);
            gl.vertexAttribPointer(shProgram.iAttribTangent, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shProgram.iAttribTangent);
        }

        if (shProgram.iAttribTexCoords >= 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordsBuffer);
            gl.vertexAttribPointer(shProgram.iAttribTexCoords, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shProgram.iAttribTexCoords);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
}
