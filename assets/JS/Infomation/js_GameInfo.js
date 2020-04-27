const JSData = require("./js_SubInfoList")

module.exports =
{ 
    gameInformationList : function (){
    
        var ConstVar = {                             //游戏常量只可读，或只写一次
            maxInfected:1000000, //失败感染人数
            initialInfected:100,  //起始感染人数
            minQuarantineRate:0.15,    //最小隔离率
            maxQuarantineRate:0.6,     //最大隔离率
            quarantineRateParameter:0.05, //隔离率系数
        
            logMaxInfected:Math.log(1000000), //maxInfected=10000
            logInitialInfected:Math.log(100), //initialInfected=100
        }


        var ChangeAbleVar = {                         //游戏变量，根据每次请求更改,现在游戏开始并没有传递其中参数，所以先默认为此
            dayCount:0, //当前天数
            hoursCount:0, //小时数

            infectedCount:100, //当前感染人数 
            infectionRate:0.3, //感染率
            dailyInfection:0,  //日感染人数
            
            recoveryRate:0.2,  //治愈率
            resourceProductivity:1, //？
            resourceConsumption:1, //？
            resourceDailyChange:0, //资源日增减

            dailyRecovery:0,   //日治愈人数

            quarantineCapacity:500,    //隔离区容量
            quarantineRate:0,  //隔离率
            quarantineCount:0, //隔离人数
            
            budgetDailyChange:0,   //财政日增减
            approvalDailyChange:0,//支持率日增减
            shutdown:0,    //封城 是1否0


            health : 100, //健康
            budget : 50 , //财政
            resource : 50 , //资源
            approval : 50, //支持度
        }


        var correspondTable = {          //中英文对应表，静态创建用于将请求json转化
            "感染率" 	:"infectionRate",
            "新增感染"	:"dailyInfection",
            "治愈率" :	"recoveryRate",
            "治愈"	:"dailyRecovery",
            "隔离区容量"	: "quarantineCapacity",
            "隔离率"	:"quarantineRate",
            "隔离区人数"	: "quarantineCount",
            "资源生产力"	:"resourceProductivity",
            "资源日耗"	:"resourceConsumption",
            "日财政出入"	:"budgetDailyChange",
            "支持率变化"	:"approvalDailyChange",
            "封城"	:"shutdown",
            "健康" :"health",
            "资源" :"resource",
            "财政":	"budget",
            "支持率":	"approval",
        }

        var getCorrespondTable = function( temp ){
            let tureKey = { }
            for( var t in temp )
            {
                let str = temp[t].toString().slice(1,temp[t].length-1).split(',');
                let tureVal = [parseInt(str[0]),parseInt(str[1])];
                tureKey[correspondTable[t]] = tureVal;
                console.log(  t  + "  getCorrespondTable  " + correspondTable[t] +"  :  "+tureVal);
            }
            return tureKey;
        }

        //设置主要信息表，便于读取和设置,以及和写出接口和前端交互
        var MainDataList = new JSData.InfomationList( {  //这里对应的是DataRegio显示
            health:ChangeAbleVar.health,
            budget:ChangeAbleVar.budget,
            resource:ChangeAbleVar.resource,
            approval:ChangeAbleVar.approval
        })

        var CardRegionInfoList = new JSData.InfomationList( { //这里对应的是CardRegion显示
            from:'',
            name:'',
            day:'',
            picUrl:'',
            information:'',
            descA:'',
            descB:'',
        }) 

        var ValChangedInfoList = new JSData.InfomationList( {  //这里储存卡牌用于计算的信息
             Game:ChangeAbleVar,
             A:ChangeAbleVar,
             B:ChangeAbleVar,
             durtion : 0, //....
        })

        var UserInfoList = new JSData.InfomationList({  //这里用于储存每次向服务器提交的信息
            'storyid' : 0,
            'handcardid': 0,      // 当前卡id
            'curcardoption': 0,   // 1或2
            'mainpara':'{}',        // 明变量json串
            'assistpara': '{}',     // 暗变量json串
            'day': 0
        })



        var PreviewData = new JSData.InfomationList({
            calculated : {A:0,B:0},  //1表示已经计算过了，0表示需要计算，前后表示AB选项
            A : { health:0,budget:0,resource:0,approval:0 },
            B : { health:0,budget:0,resource:0,approval:0 }
        })


        //这里不知道卡牌的细节，只是提供分解机制，
        //也就是说，请求新卡牌时带来的信息将立马被分解
        //若卡牌中不存在需要信息，需要报错，(其实这就需要知道卡牌里面的细节了。。。。)
        this.SolveCapturedCardInfo=function( Cardinfo ){

            //将选项AB中Val分开用于做计算，
            ValChangedInfoList.SetInfoList({
                Game : ChangeAbleVar,
                A : getCorrespondTable(Cardinfo.option.A.valChanged),
                B : getCorrespondTable(Cardinfo.option.B.valChanged),
                durtion : Cardinfo.durtion,
            })
            console.log("---------ValChangedInfoList--------- ");
            ValChangedInfoList.ShowInfoList();
            console.log("----------------------------------");
            

            //先设置一部发userInfo 。。因为其他部分需要选择卡牌后设置当前还不知道
            UserInfoList.SetInfoList({
                'storyid'  :  cc.sys.localStorage.getItem('storyid'),
                'handcardid'  :  Cardinfo.id,
            })

            //设置卡牌显示信息
            CardRegionInfoList.SetInfoList(
                {
                    from:Cardinfo.from,
                    name:Cardinfo.name,
                    picUrl:Cardinfo.picUrl,
                    information:Cardinfo.information,
                    descA:Cardinfo.option.A.desc,
                    descB:Cardinfo.option.B.desc, 

                    day:ChangeAbleVar.dayCount,//这个日期。。以后再修改吧
                }
            )

            //这里是预处理信息
            PreviewData.SetInfoList({
                calculated:{A:0,B:0}
            })
        },

        //点击选项后计算并显示数据 
        this.calculateBySelect = function( select )
        {
            let val = ValChangedInfoList.GetInfoList()
            let valinfo = val.select;  //提出表格修改
            let durtion = val.durtion; 
            let tempGameInfo = val.Game;


            console.log("------------Chang New Val-------------");
            for( let i in valinfo )
            {
                console.log(i+"======="+valinfo[i]);
            }
            console.log("------------Chang New Val-------------");
            for( let v in valinfo ) //先根据选项的改变设置新值
            {
                console.log("Valinfo:"+v+"["+valinfo[v][0]+","+valinfo[v][1]+"]");

                if( valinfo[v][0] != 0 ){
                    tempGameInfo[v] += valinfo[v][0];
                }
                else{
                    tempGameInfo[v] = valinfo[v][1];
                }
            }

            //再进行计算
            //with( ChangeAbleVar ){           /????为什么不能用with？？
            if( tempGameInfo.hoursCount==null ) tempGameInfo.hoursCount=0;
                tempGameInfo.hoursCount =  tempGameInfo.hoursCount +   durtion
                tempGameInfo.dayCount = Math.floor( tempGameInfo.hoursCount / 24) ;


                tempGameInfo.dailyRecovery=Math.ceil( tempGameInfo.infectedCount * 
                Math.pow( tempGameInfo.recoveryRate,  durtion));

                tempGameInfo.dailyInfection=( tempGameInfo.infectedCount - 
                    tempGameInfo.quarantineCount) * Math.pow( tempGameInfo.infectionRate,  durtion);

                    tempGameInfo.infectedCount= tempGameInfo.infectedCount -  
                    tempGameInfo.dailyRecovery +  tempGameInfo.dailyInfection;

                    tempGameInfo.quarantineRate=Math.min(ConstVar.maxQuarantineRate,ConstVar.minQuarantineRate + 
                (100 -  tempGameInfo.health) * ConstVar.quarantineRateParameter);

                tempGameInfo.quarantineCount=Math.min( tempGameInfo.quarantineCapacity,
                tempGameInfo.infectedCount *  tempGameInfo.quarantineRate);

                tempGameInfo.resourceDailyChange= tempGameInfo.resourceProductivity- tempGameInfo.resourceConsumption;
                if ( tempGameInfo.dayCount < 12){
                    tempGameInfo.approvalDailyChange=-0.1-0.05*(100- tempGameInfo.health);
                }else{
                    tempGameInfo.approvalDailyChange=1-0.02*(100- tempGameInfo.health);
                }
                
                tempGameInfo.health=100-(Math.log( tempGameInfo.infectedCount)-ConstVar.logInitialInfected)/
                                                    ConstVar.logMaxInfected;
                tempGameInfo.resource= tempGameInfo.resource +  tempGameInfo.resourceDailyChange;
                tempGameInfo.budget= tempGameInfo.budget +  tempGameInfo.budgetDailyChange;
                tempGameInfo.approval= tempGameInfo.approval +  tempGameInfo.approvalDailyChange;


                ValChangedInfoList.SetInfoList({
                    select : tempGameInfo,
                    Game : ChangeAbleVar,
                })

                PreviewData.SetInfoList({
                    calculated : {
                        select  : 1
                    },
                    select  : {
                        health: tempGameInfo.health>ChangeAbleVar.health?1:
                        (tempGameInfo.health<ChangeAbleVar.health?-1:0),
                        resource: tempGameInfo.resource>ChangeAbleVar.resource?1:
                        (tempGameInfo.resource<ChangeAbleVar.resource?-1:0),
                        budget: tempGameInfo.budget>ChangeAbleVar.budget?1:
                        (tempGameInfo.budget<ChangeAbleVar.budget?-1:0),
                        approval: tempGameInfo.approval>ChangeAbleVar.approval?1:
                        (tempGameInfo.approval<ChangeAbleVar.approval?-1:0)
                    }
                })


                console.log("-----------------Temp::" + select + "::-----------------")
                for( var prop in tempGameInfo )
                {
                    console.log( prop + " : " +  tempGameInfo[prop] );
                }
                console.log("---------------------------------")

            //}
            

            //现在再开始更新
            
            //cc.sys.localStorage.setItem('lastday', day)

        }
        
        //获得预览
        this.getDataPreView=function( select )  
        {
            let needCal = PreviewData.GetInfoList().calculated[select];
            if( needCal == 0 ) //需要计算
            {
                this.calculateBySelect( select )
            }
            return PreviewData.GetInfoList().select;
        }

        //确认选择
        this.confirmSelect=function(select)
        {
            let needCal = PreviewData.GetInfoList().calculated[select];
            if( needCal == 0 ) //需要计算
            {
                this.calculateBySelect( select )
            }

            let calculatedGameChangeAbleVarInfo = ValChangedInfoList.GetInfoList()[select]

            //最后才全部更新
            for( d in calculatedGameChangeAbleVarInfo )
            {
                ChangeAbleVar[d] = calculatedGameChangeAbleVarInfo[d];
            }

            MainDataList.SetInfoList({
                health:ChangeAbleVar.health,
                budget:ChangeAbleVar.budget,
                resource:ChangeAbleVar.resource,
                approval:ChangeAbleVar.approval
            })

            UserInfoList.SetInfoList({
                'curcardoption': select=='A'?1:2,   // 1或2
                'mainpara': JSON.stringify(MainDataList.GetInfoList()),        // 明变量json串
                'assistpara': JSON.stringify(ChangeAbleVar),     // 暗变量json串
                'day': ChangeAbleVar.dayCount,
            })
        }


        //返回卡牌区域信息
        this.getCardRegionInfo=function(){
            console.log("---------getCardRegionInfo--------- ");
            CardRegionInfoList.ShowInfoList();
            console.log("----------------------------------");
            return CardRegionInfoList.GetInfoList() ;
        }
        
        //返回数据区域信息
        this.getDataRegionInfo=function(){
            console.log("---------getDataRegionInfo---------");
            MainDataList.ShowInfoList();
            console.log("----------------------------------");
            return MainDataList.GetInfoList() ;
            
        }

        //返回用户信息
        this.getUserInfo=function(){
            console.log("---------getUserInfo--------- ");
            UserInfoList.ShowInfoList();
            console.log("----------------------------------");
            return UserInfoList.GetInfoList() ;
        }

        
    }

}
    