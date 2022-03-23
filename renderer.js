function Renderer(canvasName, vertSrc, fragSrc) 
{
  // public member
  this.t = 0.0;
  this.modeVal = 1;
  var that = this;
  
  var projection = new Float32Array(16);
  
  // private members (inside closure)
  var canvasName = canvasName;
  var vertSrc = vertSrc;
  var fragSrc = fragSrc;
  var canvas;
  var gl = undefined;
  var sceneVertNo = 0;
  var bufID;
  var progID = 0;
  var vertID = 0;
  var fragID = 0;
  var vertexLoc = 0;
  var texCoordLoc = 0;
  var normalLoc = 0;
  var camProjectionLoc = 0;
  var projectionLoc = 0;
  var lookAtLoc = 0;
  var meshTransformLoc = 0;
  var meshTransformTransposeInvLoc = 0;
  var modelviewLoc = 0;
  var normalMatLoc = 0;
  var modeLoc = 0;
  var camPosLoc = 0;
  var lightDirLoc = 0;
  var currentFileName = "./sphere.txt";
  var webGLVersionString = "webgl";
  
  // public 
  this.updateShader = function (newvertSrc, newfragSrc) {
    vertSrc = newvertSrc;
    fragSrc = newfragSrc;
    
    if(progID) {
      gl.deleteProgram(progID);
      progID = 0;
    }
    gl.deleteShader(vertID);
    gl.deleteShader(fragID);
    
    this.initWebGL();
  };
  
  
  // public 
  this.updateModel = function (newFileName) {
    currentFileName = newFileName;
    if(progID) {
      gl.deleteProgram(progID);
      progID = 0;
    }
    gl.deleteShader(vertID);
    gl.deleteShader(fragID);
    gl.deleteBuffer(bufID);

    this.init();
  };
  
  this.setWebGLVersion = function(version){
    webGLVersionString = version;
  };
  
  // public 
  this.init = function () {
    var request = new XMLHttpRequest();
    request.open('GET', currentFileName);
    request.send(); //"false" above, will block 
    
    sceneVertexData = new Float32Array(0);
    
    request.onload = function () {

      if (request.status !== 200) {
        alert("can not load file " + currentFileName);
      } else {
        var floatVals = request.responseText.split('\n');
        var numFloats = parseInt(floatVals[0]);
        if (numFloats % (3 + 2 + 3) === 0) {
          sceneVertexData = new Float32Array(numFloats);
          for (var k = 0; k < numFloats; k++) {
            sceneVertexData[k] = floatVals[k + 1];
          }
        }
        that.initWebGL();
      }
    };
  };
  
 
  this.initWebGL = function () {
    this.canvas = window.document.getElementById(canvasName);
    try {
        gl = this.canvas.getContext(webGLVersionString);
    } catch (e) {}
    if (!gl) {
        window.alert("Error: Could not retrieve WebGL (Version 2) context");
        return;
    }
       
    gl.enable(gl.DEPTH_TEST);
    
    setupShaders();

    // generate a Vertex Buffer Object (VBO)
    bufID = gl.createBuffer();
    
    sceneVertNo = sceneVertexData.length / (3+2+3);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, bufID);
    gl.bufferData(gl.ARRAY_BUFFER, sceneVertexData, gl.STATIC_DRAW);
    
    gl.disableVertexAttribArray(0);
    gl.disableVertexAttribArray(1);
    gl.disableVertexAttribArray(2);
    
    if(vertexLoc !== -1) {
      // position
      var offset = 0;
      var stride = (3+2+3)*Float32Array.BYTES_PER_ELEMENT;
      gl.vertexAttribPointer(vertexLoc, 3, gl.FLOAT, false, stride, offset);
      gl.enableVertexAttribArray(vertexLoc);
    }
    if(texCoordLoc !== -1) {
      // texCoord
      offset = 0 + 3*Float32Array.BYTES_PER_ELEMENT;
      gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, stride, offset);
       gl.enableVertexAttribArray(texCoordLoc);
    }
    
    if(normalLoc !== -1) {
      // normal
      offset = 0 + (3+2)*Float32Array.BYTES_PER_ELEMENT;
      gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, stride, offset);
      gl.enableVertexAttribArray(normalLoc);
    }
    this.resize(this.canvas.width, this.canvas.height);
  };
  

  //public 
  this.resize = function (w, h) {
    gl.viewport(0, 0, w, h);
    
    // this function replaces gluPerspective
    mat4Perspective(projection, 45.0, w/h, 0.5, 4.0);
    //mat4Print(projection);
  };
  
  //public 
  this.display = function () {
    if(!gl) return;
    if(!progID) return;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    var ld = new Float32Array([0.0, -1.0, -1.0]); 
    var lookAt = new Float32Array(16); 
    var cameraPos = new Float32Array([1.5, 0.0, 1.5]);
    var meshTransform = new Float32Array(16);
    var meshTransformInv = new Float32Array(16);
    var modelview = new Float32Array(16); 
    var modelviewInv = new Float32Array(16); 
    var normalMat = new Float32Array(16);
    
    mat4LookAt(lookAt,
               cameraPos[0], cameraPos[1], cameraPos[2], // eye
               0.0, 0.0, 0.0, // look at
               0.0, 0.0, 1.0); // up
    
    // apply lookAT matrix to light direction
    var lookAtInv = new Float32Array(16); 
    var m = new Float32Array(16); 
    mat4Invert(lookAt, lookAtInv);
    mat4Transpose(lookAtInv, m);
    var lightDirectionTranformed = new Float32Array(3);
    lightDirectionTranformed[0] = m[0 + 4 * 0] * ld[0] + m[0 + 4 * 1] * ld[1] + m[0 + 4 * 2] * ld[2];
    lightDirectionTranformed[1] = m[1 + 4 * 0] * ld[0] + m[1 + 4 * 1] * ld[1] + m[1 + 4 * 2] * ld[2];
    lightDirectionTranformed[2] = m[2 + 4 * 0] * ld[0] + m[2 + 4 * 1] * ld[1] + m[2 + 4 * 2] * ld[2];
    
    rotateZ(meshTransform, -this.t);
    
    var meshTransformInv = new Float32Array(16);
    var meshTransformTransposeInv = new Float32Array(16);
    
    mat4Invert(meshTransform, meshTransformInv);
    mat4Transpose(meshTransformInv, meshTransformTransposeInv);
    
    mat4Multiply(lookAt, meshTransform, modelview);
    mat4Invert(modelview, modelviewInv);
    mat4Transpose(modelviewInv, normalMat);
    
    gl.useProgram(progID);
    
    // load the current projection and modelview matrix into the
    // corresponding UNIFORM variables of the shader
    if(camProjectionLoc)  gl.uniformMatrix4fv(camProjectionLoc, false, projection);
    if(projectionLoc)  gl.uniformMatrix4fv(projectionLoc, false, projection);
    if(lookAtLoc) gl.uniformMatrix4fv(lookAtLoc, false, lookAt);
    if(meshTransformLoc) gl.uniformMatrix4fv(meshTransformLoc, false, meshTransform);
    if(meshTransformTransposeInvLoc)  gl.uniformMatrix4fv(meshTransformTransposeInvLoc, false, meshTransformTransposeInv);
    if(modelviewLoc) gl.uniformMatrix4fv(modelviewLoc, false, modelview);
    if(normalMatLoc)  gl.uniformMatrix4fv(normalMatLoc, false, normalMat);
    if(modeLoc) gl.uniform1i(modeLoc, this.modeVal);
    if(camPosLoc) gl.uniform3fv(camPosLoc, cameraPos);
    if(lightDirLoc) gl.uniform3fv(lightDirLoc, lightDirectionTranformed);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, bufID);
    gl.drawArrays(gl.TRIANGLES, 0, sceneVertNo);
  };
  
  // private 
  function setupShaders() {

    // create shader
    vertID = gl.createShader(gl.VERTEX_SHADER);
    fragID = gl.createShader(gl.FRAGMENT_SHADER);

    // specify shader source
    gl.shaderSource(vertID, vertSrc);
    gl.shaderSource(fragID, fragSrc);

    // compile the shader
    gl.compileShader(vertID);
    gl.compileShader(fragID);

    var error = false;
    // check for errors
    if(!gl.getShaderParameter(vertID, gl.COMPILE_STATUS)) {
      document.getElementById("code_vert_error").innerHTML = "invalid vertex shader : " + gl.getShaderInfoLog(vertID);
      error = true;
    }
    else{
      document.getElementById("code_vert_error").innerHTML = "";
    }
    if(!gl.getShaderParameter(fragID, gl.COMPILE_STATUS)) {
      document.getElementById("code_frag_error").innerHTML = "invalid fragment shader : " + gl.getShaderInfoLog(fragID);
      error = true;
    }else{
      document.getElementById("code_frag_error").innerHTML = "";
    }
    
    if(error) return;
    
    // create program and attach shaders
    progID = gl.createProgram();
    gl.attachShader(progID, vertID);
    gl.attachShader(progID, fragID);

    // link the program
    gl.linkProgram(progID);
    if (!gl.getProgramParameter(progID, gl.LINK_STATUS)) {
      alert(gl.getProgramInfoLog(progID));
      return;
    }
    
    // retrieve the location of the IN variables of the vertex shader
    vertexLoc = gl.getAttribLocation(progID,"position");
    texCoordLoc =  gl.getAttribLocation(progID,"texcoord");
    normalLoc = gl.getAttribLocation(progID, "normal");
    
    // retrieve the location of the UNIFORM variables of the shader
    lookAtLoc = gl.getUniformLocation(progID, "cameraLookAt");
    camProjectionLoc = gl.getUniformLocation(progID, "cameraProjection");
    projectionLoc = gl.getUniformLocation(progID, "projection");
    meshTransformLoc = gl.getUniformLocation(progID, "meshTransform");
    meshTransformTransposeInvLoc = gl.getUniformLocation(progID, "meshTransformTransposedInverse");
    modelviewLoc = gl.getUniformLocation(progID, "modelview");
    normalMatLoc = gl.getUniformLocation(progID, "normalMat");
    modeLoc = gl.getUniformLocation(progID, "mode");
    camPosLoc = gl.getUniformLocation(progID, "cameraPosition");
    lightDirLoc = gl.getUniformLocation(progID, "lightDirection");
  }
  
  // the following functions are some matrix and vector helpers
  // they work for this demo but in general it is recommended
  // to use more advanced matrix libraries
  function vec3Dot(a, b) {
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  }

  function vec3Cross(a, b, res) {
    res[0] = a[1] * b[2]  -  b[1] * a[2];
    res[1] = a[2] * b[0]  -  b[2] * a[0];
    res[2] = a[0] * b[1]  -  b[0] * a[1];
  }

  function vec3Normalize(a) {
    var mag = Math.sqrt(a[0] * a[0]  +  a[1] * a[1]  +  a[2] * a[2]);
    a[0] /= mag; a[1] /= mag; a[2] /= mag;
  } 
  
  function mat4Identity(a) {
    a.length = 16;
    for (var i = 0; i < 16; ++i) a[i] = 0.0;
    for (var i = 0; i < 4; ++i) a[i + i * 4] = 1.0;
  }

  function mat4Multiply(a, b, res) {
    for (var i = 0; i < 4; ++i) {
      for (var j = 0; j < 4; ++j) {
        res[j*4 + i] = 0.0;
        for (var k = 0; k < 4; ++k) {
          res[j*4 + i] += a[k*4 + i] * b[j*4 + k];
        }
      }
    }
  }
  
  function mat4Perspective(a, fov, aspect, zNear, zFar) {
    var f = 1.0 / Math.tan (fov/2.0 * (Math.PI / 180.0));
    mat4Identity(a);
    a[0] = f / aspect;
    a[1 * 4 + 1] = f;
    a[2 * 4 + 2] = (zFar + zNear)  / (zNear - zFar);
    a[3 * 4 + 2] = (2.0 * zFar * zNear) / (zNear - zFar);
    a[2 * 4 + 3] = -1.0;
    a[3 * 4 + 3] = 0.0;
  }
  
  function  mat4LookAt(viewMatrix,
      eyeX, eyeY, eyeZ,
      centerX, centerY, centerZ,
      upX, upY, upZ) {

    var dir = new Float32Array(3);
    var right = new Float32Array(3);
    var up = new Float32Array(3);
    var eye = new Float32Array(3);

    up[0]=upX; up[1]=upY; up[2]=upZ;
    eye[0]=eyeX; eye[1]=eyeY; eye[2]=eyeZ;

    dir[0]=centerX-eyeX; dir[1]=centerY-eyeY; dir[2]=centerZ-eyeZ;
    vec3Normalize(dir);
    vec3Cross(dir,up,right);
    vec3Normalize(right);
    vec3Cross(right,dir,up);
    vec3Normalize(up);
    // first row
    viewMatrix[0]  = right[0];
    viewMatrix[4]  = right[1];
    viewMatrix[8]  = right[2];
    viewMatrix[12] = -vec3Dot(right, eye);
    // second row
    viewMatrix[1]  = up[0];
    viewMatrix[5]  = up[1];
    viewMatrix[9]  = up[2];
    viewMatrix[13] = -vec3Dot(up, eye);
    // third row
    viewMatrix[2]  = -dir[0];
    viewMatrix[6]  = -dir[1];
    viewMatrix[10] = -dir[2];
    viewMatrix[14] =  vec3Dot(dir, eye);
    // forth row
    viewMatrix[3]  = 0.0;
    viewMatrix[7]  = 0.0;
    viewMatrix[11] = 0.0;
    viewMatrix[15] = 1.0;
  }
  
  function mat4Print(a) {
    // opengl uses column major order
    var out = "";
    for (var i = 0; i < 4; ++i) {
      for (var j = 0; j < 4; ++j) {
        out += a[j * 4 + i] + " ";
      }
      out += "\n";
    }
    alert(out);
  }
  
  function mat4Transpose(a, transposed) {
    var t = 0;
    for (var i = 0; i < 4; ++i) {
      for (var j = 0; j < 4; ++j) {
        transposed[t++] = a[j * 4 + i];
      }
    }
  }

  function mat4Invert(m, inverse) {
    var inv = new Float32Array(16);
    inv[0] = m[5]*m[10]*m[15]-m[5]*m[11]*m[14]-m[9]*m[6]*m[15]+
             m[9]*m[7]*m[14]+m[13]*m[6]*m[11]-m[13]*m[7]*m[10];
    inv[4] = -m[4]*m[10]*m[15]+m[4]*m[11]*m[14]+m[8]*m[6]*m[15]-
             m[8]*m[7]*m[14]-m[12]*m[6]*m[11]+m[12]*m[7]*m[10];
    inv[8] = m[4]*m[9]*m[15]-m[4]*m[11]*m[13]-m[8]*m[5]*m[15]+
             m[8]*m[7]*m[13]+m[12]*m[5]*m[11]-m[12]*m[7]*m[9];
    inv[12]= -m[4]*m[9]*m[14]+m[4]*m[10]*m[13]+m[8]*m[5]*m[14]-
             m[8]*m[6]*m[13]-m[12]*m[5]*m[10]+m[12]*m[6]*m[9];
    inv[1] = -m[1]*m[10]*m[15]+m[1]*m[11]*m[14]+m[9]*m[2]*m[15]-
             m[9]*m[3]*m[14]-m[13]*m[2]*m[11]+m[13]*m[3]*m[10];
    inv[5] = m[0]*m[10]*m[15]-m[0]*m[11]*m[14]-m[8]*m[2]*m[15]+
             m[8]*m[3]*m[14]+m[12]*m[2]*m[11]-m[12]*m[3]*m[10];
    inv[9] = -m[0]*m[9]*m[15]+m[0]*m[11]*m[13]+m[8]*m[1]*m[15]-
             m[8]*m[3]*m[13]-m[12]*m[1]*m[11]+m[12]*m[3]*m[9];
    inv[13]= m[0]*m[9]*m[14]-m[0]*m[10]*m[13]-m[8]*m[1]*m[14]+
             m[8]*m[2]*m[13]+m[12]*m[1]*m[10]-m[12]*m[2]*m[9];
    inv[2] = m[1]*m[6]*m[15]-m[1]*m[7]*m[14]-m[5]*m[2]*m[15]+
             m[5]*m[3]*m[14]+m[13]*m[2]*m[7]-m[13]*m[3]*m[6];
    inv[6] = -m[0]*m[6]*m[15]+m[0]*m[7]*m[14]+m[4]*m[2]*m[15]-
             m[4]*m[3]*m[14]-m[12]*m[2]*m[7]+m[12]*m[3]*m[6];
    inv[10]= m[0]*m[5]*m[15]-m[0]*m[7]*m[13]-m[4]*m[1]*m[15]+
             m[4]*m[3]*m[13]+m[12]*m[1]*m[7]-m[12]*m[3]*m[5];
    inv[14]= -m[0]*m[5]*m[14]+m[0]*m[6]*m[13]+m[4]*m[1]*m[14]-
             m[4]*m[2]*m[13]-m[12]*m[1]*m[6]+m[12]*m[2]*m[5];
    inv[3] = -m[1]*m[6]*m[11]+m[1]*m[7]*m[10]+m[5]*m[2]*m[11]-
             m[5]*m[3]*m[10]-m[9]*m[2]*m[7]+m[9]*m[3]*m[6];
    inv[7] = m[0]*m[6]*m[11]-m[0]*m[7]*m[10]-m[4]*m[2]*m[11]+
             m[4]*m[3]*m[10]+m[8]*m[2]*m[7]-m[8]*m[3]*m[6];
    inv[11]= -m[0]*m[5]*m[11]+m[0]*m[7]*m[9]+m[4]*m[1]*m[11]-
             m[4]*m[3]*m[9]-m[8]*m[1]*m[7]+m[8]*m[3]*m[5];
    inv[15]= m[0]*m[5]*m[10]-m[0]*m[6]*m[9]-m[4]*m[1]*m[10]+
             m[4]*m[2]*m[9]+m[8]*m[1]*m[6]-m[8]*m[2]*m[5];

    var det = m[0]*inv[0]+m[1]*inv[4]+m[2]*inv[8]+m[3]*inv[12];
    if (det === 0) return false;
    det = 1.0 / det;
    for (var i = 0; i < 16; i++) inverse[i] = inv[i] * det;
    return true;
  }
  
  function rotateZ(rot, degree) {
    mat4Identity(rot);
    var rad = Math.PI / 180.0 * degree;
    rot[0 + 4 * 0] = Math.cos(rad);
    rot[1 + 4 * 0] = Math.sin(rad);
    rot[0 + 4 * 1] = -Math.sin(rad); 
    rot[1 + 4  *1] = Math.cos(rad);   
  }
  
} 