
var Layout = function () {
    self = this;

    self.viewHeight = function () {
        var y1 = document.getElementById('header').offsetHeight;
        var y0 = window.innerHeight;
        return Math.max(y0 - y1, 600);
    }

    self.viewWidth = function () {
        return Math.max(window.innerWidth, 960);
    }

    self.getPosition = function(n,endNode){
        var left = 0;
        var top =0;
        var node = n;
        done=false;
        while(!done){
            if(node.offsetLeft!=null)
                left += node.offsetLeft;
            if(node.offsetTop!=null)
                top += node.offsetTop;
            if(node.offsetParent){
                node = node.offsetParent;
            }else{
                done = true;
            }
            if(node == endNode)
                done = true;
        }
        done=false;
        node = n;
        while(!done){
            if(document.all && node.style && parseInt(node.style.borderLeftWidth)){
                left += parseInt(node.style.borderLeftWidth);
            }
            if(document.all && node.style && parseInt(node.style.borderTopWidth)){
                top += parseInt(node.style.borderTopWidth);
            }

            if(node.scrollLeft){
                left -= node.scrollLeft;
            }
            if(node.scrollTop)
                top -= node.scrollTop;
            if(node.parentNode)
                node = node.parentNode;
            else
                done=true;
        }
        return new Array(left, top);
    }

    self.positionPanel = function(idButton, idPanel, panelWidth) {
        var button = document.getElementById(idButton);
        var panel = document.getElementById(idPanel);
        var pos = self.getPosition(button);

        var xMax = window.innerWidth - Math.max(panelWidth, panel.offsetWidth);

        // Set the position of the panel to be below the button
        panel.style.left = Math.min(pos[0], xMax) + 'px';
        panel.style.top = (pos[1] + filterButton.offsetHeight) + 'px';
        panel.style.position = 'absolute';
    }

    self.update = function () {
        // Setup the view
        d3.select(".view")
          .attr("height", self.viewHeight)
          .attr("width", self.viewWidth);
        
        // Set the position of the filter panel
        self.positionPanel('filterButton', 'filterCollapse', 325);  // offsetWidth = 0 when this routine is called initially :/
        self.positionPanel('optionsButton', 'optionsCollapse', 300);  

    }
}

window.layout = new Layout();
