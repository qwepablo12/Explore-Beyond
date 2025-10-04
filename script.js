const OSD_PREFIX_URL = "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/"; 

let mainViewer = null;
let viewerLeft = null; 
let viewerRight = null; 
let compareMode = false;

let compareEnterBtn = null; 
let compareExitBtn = null;  
let compareSelectorLeft = null; 
let compareSelectorRight = null; 
let confirmCompareBtn = null;

const annotationsStore = {
    "images/andromeda.dzi": [],
    "images/OrionNebula.dzi": [],
    "images/red-andromeda.dzi": [],
    "images/Hubble Sees a Star ‘Inflating’ a Giant Bubble.dzi": []
};


document.addEventListener('DOMContentLoaded', () => {
    const imageInfoData = {
        "images/andromeda.dzi": "<b>Anromeda Galaxy:</b> The largest galaxy in our local group, it is located approximately 2.5 million light-years from Earth. It may collide with the Milky Way in the future.",
        "images/OrionNebula.dzi": "<b>Orion Nebula:</b> One of the brightest and most famous nebulae, located approximately 1,350 light-years away, is a region of active star formation.",
        "images/Hubble Sees a Star ‘Inflating’ a Giant Bubble.dzi": "<b>Giant Bubble:</b> This image of a star creating a massive gas bubble was captured by the Hubble Space Telescope. It's a striking example of stellar activity and interaction with its surroundings.",
        "images/red-andromeda.dzi": "<b>Red Andromeda Galaxy:</b> A variation of the Andromeda image with an emphasis on red regions, allowing the study of star formation processes and the structure of the galaxy."
    };

    compareEnterBtn = document.getElementById('compare-enter-btn');
    compareExitBtn = document.getElementById('compare-exit-btn');
    confirmCompareBtn = document.getElementById('confirm-compare-btn'); 
    compareSelectorLeft = document.getElementById('compare-selector-left'); 
    compareSelectorRight = document.getElementById('compare-selector-right');

    if (document.getElementById('openseadragon-viewer')) {
        if (compareEnterBtn) compareEnterBtn.onclick = toggleCompareMode;
        if (compareExitBtn) compareExitBtn.onclick = toggleCompareMode;
        const defaultDziFile = document.getElementById('image-selector').value;
        mainViewer = initializeMainViewer(defaultDziFile);
        
        document.getElementById('image-selector').addEventListener('change', function() {
            if (!compareMode) {
                loadImage(this.value);
                const infoBlock = document.getElementById('image-info');
                if (infoBlock && imageInfoData[this.value]) {
                    infoBlock.innerHTML = imageInfoData[this.value];
                }
            }
        });
        
    } 
    if (document.getElementById('viewer-left') && document.getElementById('viewer-right')) {
        if (compareSelectorLeft && compareSelectorRight) {
            viewerLeft = createIndependentViewer("viewer-left", compareSelectorLeft.value);
            viewerRight = createIndependentViewer("viewer-right", compareSelectorRight.value);
        }
        
        if (confirmCompareBtn) {
            confirmCompareBtn.addEventListener('click', function() {
                if (viewerLeft) viewerLeft.open(compareSelectorLeft.value);
                if (viewerRight) viewerRight.open(compareSelectorRight.value);
            });
        }
    }
});

/**
 * @param {OpenSeadragon.Viewer} viewer 
 * @param {number} x 
 * @param {number} y 
 * @param {string} text 
 */
function addAnnotationElement(viewer, x, y, text) {
    const annotationDiv = document.createElement('div');
    annotationDiv.className = 'annotation-pin'; 
    annotationDiv.id = 'ann-' + Date.now(); 

    const textEditor = document.createElement('textarea');
    textEditor.value = text;
    textEditor.className = 'annotation-text-editor';
    textEditor.disabled = true; 

    const editButton = document.createElement('button');
    editButton.innerHTML = '✎';
    editButton.className = 'annotation-edit-btn';
    
    editButton.onclick = () => {
        const isEditing = !textEditor.disabled;
        textEditor.disabled = isEditing;
        editButton.innerHTML = isEditing ? '✎' : '💾'; 
        if (isEditing) {
            console.log(`Annotation ${annotationDiv.id} saved: ${textEditor.value}`);
        }
        textEditor.focus();
    };

    annotationDiv.append(editButton, textEditor);
    viewer.addOverlay(annotationDiv, new OpenSeadragon.Point(x, y), OpenSeadragon.OverlayPlacement.CENTER);
    
    return { x, y, text, id: annotationDiv.id };
}


function loadAnnotations(viewer, dziFile) {
    viewer.clearOverlays();
    
    const annotations = annotationsStore[dziFile] || [];

    annotations.forEach(ann => {
        addAnnotationElement(viewer, ann.x, ann.y, ann.text);
    });
}


function initializeMainViewer(dziFile) {
    if (mainViewer && mainViewer.destroy) {
        mainViewer.destroy(); 
    }
    if (!document.getElementById("openseadragon-viewer")) return null; 

    mainViewer = OpenSeadragon({
        id: "openseadragon-viewer",
        prefixUrl: OSD_PREFIX_URL, 
        tileSources: dziFile, 
        showNavigator: true, 
        animationTime: 0.5,
        visibilityRatio: 1.0,
        constrainDuringPan: true
    });

    mainViewer.addHandler('canvas-double-click', function(event) {
        if (event.quick) {
            event.preventDefaultAction = true;
            
            const viewportPoint = mainViewer.viewport.pointFromPixel(event.position);
            const imagePoint = mainViewer.viewport.viewportToImageCoordinates(viewportPoint);

            const dziFile = document.getElementById('image-selector').value;
            const newAnnotation = addAnnotationElement(mainViewer, imagePoint.x, imagePoint.y, "Новая заметка");
            
            if (!annotationsStore[dziFile]) {
                annotationsStore[dziFile] = [];
            }
            annotationsStore[dziFile].push(newAnnotation);
        }
    });

    loadAnnotations(mainViewer, dziFile);

    return mainViewer;
}

function createIndependentViewer(id, dziFile) {
    if (!document.getElementById(id)) return null; 
    
    return OpenSeadragon({
        id: id,
        prefixUrl: OSD_PREFIX_URL, 
        tileSources: dziFile,
        showNavigator: true, 
        animationTime: 0.5
    });
}


function loadImage(dziFile) {
    if (mainViewer) {
        mainViewer.open(dziFile);
    } else {
        mainViewer = initializeMainViewer(dziFile);
    }
}


function toggleCompareMode() {
    compareMode = !compareMode;
    const mainSection = document.querySelector('.viewer-section:first-of-type');
    const compareSection = document.getElementById('compare-section');

    const currentSelectedImage = document.getElementById('image-selector').value;

    if (compareMode) {
        compareEnterBtn.classList.add('hidden');
        compareExitBtn.classList.remove('hidden'); 
        mainSection.classList.add('hidden');
        compareSection.classList.remove('hidden');
        if (mainViewer) { mainViewer.destroy(); mainViewer = null; }
        viewerLeft = createIndependentViewer("viewer-left", "images/andromeda.dzi");
        viewerRight = createIndependentViewer("viewer-right", "images/OrionNebula.dzi");
    } else {
        compareExitBtn.classList.add('hidden');
        compareEnterBtn.classList.remove('hidden'); 
        mainSection.classList.remove('hidden');
        compareSection.classList.add('hidden');

        if (viewerLeft) { viewerLeft.destroy(); viewerLeft = null; }
        if (viewerRight) { viewerRight.destroy(); viewerRight = null; }
        
        mainViewer = initializeMainViewer(currentSelectedImage);
    }
}