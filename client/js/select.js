import { LeafletMap } from "./map.js"

const map = new LeafletMap()
const size = document.getElementById("map-CircleRadius-range")

const joinSubmit = document.getElementById('join-submit')
const onPosIcon = document.getElementById("onPosIcon")
const hostMapNext = document.getElementById('host-map-next')

joinSubmit.addEventListener('click', ()=>{
    map.init("host-map-placer").then(async () => {
        map.CreateCenterZone(100)

        map.CenterMap(14)

        map.MarkSelf()

        onPosIcon.onclick = () => {
            map.CenterMap()
        }
    
        size.oninput = function () {
            map.SetZoneRadius(this.value)
        }
    
        size.onchange = function () {
            map.SetZoneRadius(this.value)
        }   

        hostMapNext.onclick = ()=>{
            document.mapCenter = map.map.getCenter()
            document.circleRadius = map.ct.getRadius()
        }
    })  
})