

cc.Class({
    extends: cc.Component,

    properties: {
        cardPerfab: cc.Prefab
    },

    init:function (info) {  
        //创建队列
        //this.myCardList = new CardList();
        this.topCard = null;

        this.showTopCard( info );
    },

    showTopCard : function( info )  //更新卡牌是创建新节点
    {
        this.topCard = cc.instantiate(this.cardPerfab); //创建新节点
        this.node.addChild(this.topCard);    //加入到子节点下
        this.topCard.getComponent('js_cardTemplate').init(info);
    },

    getNextCard : function( select,info ){

        this.moveOldCard( select );

        this.topCard.destroy();
        
        this.showTopCard(info);
    },

    //移动旧卡牌
    moveOldCard : function( select ){
        // 1.克隆第一张
        let cloneCard =  this.cloneNode(this.topCard);
        cloneCard.zIndex = 9
        // 2.获取章戳，选择并盖章
        let seal = cloneCard.getChildByName("seal_wrap")
        let sealBox = cloneCard.getChildByName("seal_box")

        let sealBoxPos ; 
        if( select == 'A' ){
            sealBox.x = -165
            sealBoxPos = [-165,-310]
        }
        else if( select=='B') {
            sealBox.x = 165
            sealBoxPos = [ 150,-310]
        }
        sealBox.active = true
        this.moveSeal(sealBox,seal,sealBoxPos[0],sealBoxPos[1]);

        // 3.移走克隆的卡片
        setTimeout(() => {
            this.moveCard(cloneCard)
        }, 1500);

        return true;
    },

     // 克隆卡牌
    cloneNode(target) {
        // let scene = cc.director.getScene();
        let clone = cc.instantiate(target);
        clone.parent = this.node;
        clone.setPosition(0,0);

        return clone
    },
    // 向下盖章动画
    moveSeal(sealBox,seal,positionX,positionY) {
        cc.tween(sealBox)
        .to(0.5, { position: cc.v2(positionX, positionY)})
        .call(() => {
            // 显示印章
            seal.setPosition(positionX,positionY-60)
            seal.active = true
            cc.tween(sealBox)
            .to(0.5, { position: cc.v2(positionX, -280)})
            .call(() => {
                sealBox.active = false
            })
            .start()
        })
        .start()
    },
    // 移牌动画
    moveCard(target) {
        cc.tween(target)
        .to(0.5, { scale: 1.1 })
        .to(1, { position: cc.v2(-750, 25), scale: 0.9})
        .call(() => {
            target.destroy();
        })
        .start()
    },


    

});