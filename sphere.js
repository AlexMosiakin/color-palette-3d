    let r = 0.0;
    let g = 0.0;
    let b = 0.0;
    const fragContainer = document.getElementById('code_frag');

    function updateColor(r,g,b){
        fragContainer.innerHTML = `#version 300 es
        precision highp float;
        out vec4 outColor;
        
        in vec2 tc;
        in vec3 fn;
        in vec3 vertPos;
        
        uniform int mode;
        uniform vec3 lightDirection;
        
        
        const vec4 ambientColor = vec4(${r}, ${g}, ${b}, 1.0);
        const vec4 diffuseColor = vec4(0.0, 0.0, 0.0, 1.0);
        const vec4 specularColor = vec4(1.0, 1.0, 1.0, 1.0);
        const float shininess = 50.0;
        const vec4 lightColor = vec4(1.0, 1.0, 1.0, 1.0);
        const float irradiPerp = 1.0;
        
        vec3 phongBRDF(vec3 lightDir, vec3 viewDir, vec3 normal, vec3 phongDiffuseCol, vec3 phongSpecularCol, float phongShininess) {
            vec3 color = phongDiffuseCol;
            vec3 reflectDir = reflect(-lightDir, normal);
            float specDot = max(dot(reflectDir, viewDir), 0.0);
            color += pow(specDot, phongShininess) * phongSpecularCol;
            return color;
        }
        
        void main() {
            vec3 lightDir = normalize(-lightDirection);
            vec3 viewDir = normalize(-vertPos);
            vec3 n = normalize(fn);
        
            vec3 radiance = ambientColor.rgb;
            
            float irradiance = max(dot(lightDir, n), 0.0) * irradiPerp;
            if(irradiance &gt; 0.0) {
            vec3 brdf = phongBRDF(lightDir, viewDir, n, diffuseColor.rgb, specularColor.rgb, shininess);
            radiance += brdf * irradiance * lightColor.rgb;
            }
        
            radiance = pow(radiance, vec3(1.0 / 2.2) ); // gamma correction
            outColor.rgb = radiance;
            outColor.a = 1.0;
        }`;
        }

    function hexToRgb() {
        localItems = JSON.parse(localStorage.getItem("palettes"));
        if(localItems == null || localItems.length == 0){
            r = 1.0;
            g = 1.0;
            b = 1.0;
        }else{
            const color = localItems[localItems.length - 1].colors[0]
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
            r = parseInt(result[1], 16) / 255;
            g = parseInt(result[2], 16) / 255;
            b = parseInt(result[3], 16) / 255;
        }

    }
    hexToRgb();
    updateColor(r,g,b);

    const addColorBtn = document.querySelector('.add-color');
    addColorBtn.addEventListener('click', () => {
    hexToRgb();
    updateColor(r,g,b);
    updateRenderer();
    })

      
      var renderer = undefined;

      function run() {
        var vertSrc = document.getElementById("code_vert").value;
        var fracSrc = document.getElementById("code_frag").value;

        renderer = new Renderer("myWebGLCanvas", vertSrc, fracSrc);
        renderer.setWebGLVersion("webgl2");
        renderer.init();
        renderer.display();
      }

      function updateRenderer() {
        var vertSrc = document.getElementById("code_vert").value;
        var fragSrc = document.getElementById("code_frag").value;

        renderer.updateShader(vertSrc, fragSrc);
        renderer.display();
      }

      var interval = setInterval(timerFunc, 40);

      function timerFunc() {
        var offset = 1.0;
        renderer.t += offset;
        renderer.display();
      }

      function modeChanged() {
        var d = document.getElementById("select_id").value;
        renderer.modeVal = d;
      }

      function modelChanged() {
        var d = document.getElementById("select_id2").value;
        renderer.updateModel(d);
        renderer.display();
      }

      function exampleChanged() {
        var d = document.getElementById("select_example_id").value;
        switch (parseInt(d)) {
          case 1:
            document.getElementById("code_vert").value = document.getElementById("PhongBrdfPerVertVert").value;
            document.getElementById("code_frag").value = document.getElementById("PhongBrdfPerVertFrag").value;
            break;
          case 2:
            document.getElementById("code_vert").value = document.getElementById("PhongBrdfCamSpaceVert").value;
            document.getElementById("code_frag").value = document.getElementById("PhongBrdfCamSpaceFrag").value;
            break;
          case 3:
            document.getElementById("code_vert").value = document.getElementById("PhongBrdfWorldSpaceVert").value;
            document.getElementById("code_frag").value = document.getElementById("PhongBrdfWorldSpaceFrag").value;
            break;
          case 4:
            document.getElementById("code_vert").value = document.getElementById("BlinnPhongBrdfCameraSpaceVert").value;
            document.getElementById("code_frag").value = document.getElementById("BlinnPhongBrdfCameraSpaceFrag").value;
            break;
          case 5:
            document.getElementById("code_vert").value = document.getElementById("BlinnPhongBrdfWorldSpaceVert").value;
            document.getElementById("code_frag").value = document.getElementById("BlinnPhongBrdfWorldSpaceFrag").value;
            break;
        }

        updateRenderer();
      }

      run();

    