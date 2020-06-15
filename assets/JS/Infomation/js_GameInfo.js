const JSData = require("./js_SubInfoList")
const ConstVar = require("./js_constant");
const ChangeAbleVar = require("./Variable").variable

const correspondTable = require("./correspondTable");



import {setMainData,getMainData} from './MainData';
import {setAssistParameter,getAssistParameter} from './AssistParameter';




module.exports =
{ 
    gameInformationList : function (){
    
        //设置主要信息表，便于读取和设置,以及和写出接口和前端交互

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
             A:ChangeAbleVar,
             B:ChangeAbleVar,
             durtion : 0, //....
        })

        var UserInfoList = new JSData.InfomationList({  //这里用于储存每次向服务器提交的信息
            storyid : 0,
            handcardid: 0,      // 当前卡id
            curcardoption: 0,   // 1或2
            mainpara:'{}',        // 明变量json串
            assistpara: '{}',     // 暗变量json串
            day: 1
        })

        var PreviewData = new JSData.InfomationList({
            calculatedA : 0,  //1表示已经计算过了，0表示需要计算
            calculatedB : 0,
            A : { health:0,budget:0,resource:0,approval:0 },
            B : { health:0,budget:0,resource:0,approval:0 },
            clear : { health:0,budget:0,resource:0,approval:0 }
        })




        //这里不知道卡牌的细节，只是提供分解机制，
        //也就是说，请求新卡牌时带来的信息将立马被分解
        //若卡牌中不存在需要信息，需要报错，(其实这就需要知道卡牌里面的细节了。。。。)
        this.SolveCapturedCardInfo=function( Cardinfo ){

           

            //将选项AB中Val分开用于做计算，
            ValChangedInfoList.SetInfoList({
                Game : ChangeAbleVar,
                A : correspondTable.getCorrespond(Cardinfo.option.A.valChanged),
                B : correspondTable.getCorrespond(Cardinfo.option.B.valChanged),
                durtion : Cardinfo.durtion,
            })
            console.log("---------ValChangedInfoList--------- ");
            ValChangedInfoList.ShowInfoList();
            console.log("----------------------------------");
            

            //先设置一部发userInfo 。。因为其他部分需要选择卡牌后设置当前还不知道
            UserInfoList.SetInfoList({
                
                handcardid  :  Cardinfo.id,
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
                calculatedA:0,
                calculatedB:0
            })
        },

        //点击选项后计算并显示数据 
        this.calculateBySelect = function( select )
        {
            let val = ValChangedInfoList.GetInfoList()
            let valinfo = {}

            valinfo = val[select.toString()];  //提出表格修改
            
            

            //let durtion = val.durtion; 
            let tempGameInfo = {};
            for( let d in ChangeAbleVar )
            {
                tempGameInfo[d] = ChangeAbleVar[d];
            }


            console.log("------------Chang New Val-------------");
            for( let v in valinfo ) //先根据选项的改变设置新值
            {
                if( valinfo[v][0] != 0 ){
                    tempGameInfo[v] += valinfo[v][0];
                }
                else{
                    tempGameInfo[v] = valinfo[v][1];
                }

                console.log("Valinfo:"+v+"["+valinfo[v][0]+","+valinfo[v][1]+"]" + "tempGameInfo[v]:" + tempGameInfo[v]);
            }
            console.log("------------Chang New Val-------------");


            tempGameInfo =  this.calculateVal( Object.assign({},tempGameInfo),val.durtion );
            this.printTempGameInfomation(tempGameInfo,select);

                
            this.solveMainDataPreview(tempGameInfo,select );
        }
        
       

        //确认选择
        this.confirmSelect=function(select)
        {
            
            let lastCalculatedVarInfo = this.getCalculatedVarInfo(ValChangedInfoList,select);
            
            //最后才全部更新
            for( let d in lastCalculatedVarInfo )
            {
                ChangeAbleVar[d] = lastCalculatedVarInfo[d];
            }

            setMainData({
                health:ChangeAbleVar.health,
                budget:ChangeAbleVar.budget,
                resource:ChangeAbleVar.resource,
                approval:ChangeAbleVar.approval
            })

            setAssistParameter(ChangeAbleVar);

            UserInfoList.SetInfoList({
                storyid  :  cc.sys.localStorage.getItem('storyid'),
                //handid再前面获取了
                curcardoption: select=='A'?1:2,   // 1或2
                mainpara: JSON.stringify(getMainData() ),        // 明变量json串
                assistpara: JSON.stringify(getAssistParameter()),     // 暗变量json串
                day: ChangeAbleVar.dayCount +1 ,
                
            })

            cc.sys.localStorage.setItem('lastday', ChangeAbleVar.dayCount)


           
        }

         //获得预览
         this.getDataPreView=function( select )  
         {
           
            console.log( "getDataPreView " + select);
             if( select == 'A'  )
             {
                if( PreviewData.GetInfoList().calculatedA == 0 )
                this.calculateBySelect( 'A' );

                for( let i in  PreviewData.GetInfoList().A ) 
                {
                    console.log(i + " : " +  PreviewData.GetInfoList().A[i] );
                }

                return PreviewData.GetInfoList().A;
             }
             else if( select == 'B' )
             {
                if( PreviewData.GetInfoList().calculatedB == 0 )
                this.calculateBySelect( 'B' );

                for( let i in  PreviewData.GetInfoList().B ) 
                {
                    console.log(i + " : " +  PreviewData.GetInfoList().B[i] );
                }

                return PreviewData.GetInfoList().B;
             }
             else if (select==0)
             {
                 return PreviewData.GetInfoList().clear;
             }

            


         }

        //返回卡牌区域信息
        this.getCardRegionInfo=function(){
           
            return CardRegionInfoList.GetInfoList() ;
        }
        
        //返回数据区域信息
        this.getDataRegionInfo=function(){
           
            return getMainData() ;
            
        }

        //返回用户信息
        this.getUserInfo=function(){
            
            return UserInfoList.GetInfoList() ;
        },

        
        this.calculateVal = function( tempGameInfo,durtion ){

            if( tempGameInfo.hoursCount==null ) tempGameInfo.hoursCount=0;

                tempGameInfo.hoursCount =  tempGameInfo.hoursCount +   durtion ;
                tempGameInfo.dayCount = Math.floor( tempGameInfo.hoursCount / 24) ;


                tempGameInfo.dailyRecovery=Math.ceil( tempGameInfo.infectedCount *  Math.pow( 1+tempGameInfo.recoveryRate,  durtion));

                tempGameInfo.dailyInfection=( tempGameInfo.infectedCount - 
                    tempGameInfo.quarantineCount) * Math.pow( 1+tempGameInfo.infectionRate,  durtion);

                tempGameInfo.infectedCount= Math.max( tempGameInfo.infectedCount -  
                    tempGameInfo.dailyRecovery +  tempGameInfo.dailyInfection, 0.1 );

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
                
                tempGameInfo.health=
                    Math.floor( 100-(Math.log( tempGameInfo.infectedCount )-ConstVar.logInitialInfected)/ ConstVar.logMaxInfected );
                tempGameInfo.resource= Math.floor( tempGameInfo.resource +  tempGameInfo.resourceDailyChange ) ;
                tempGameInfo.budget= Math.floor( tempGameInfo.budget +  tempGameInfo.budgetDailyChange );
                tempGameInfo.approval= Math.floor(tempGameInfo.approval +  tempGameInfo.approvalDailyChange);
                
                cc.log("calculate over");
                return tempGameInfo;
        }

        this.getCalculatedVarInfo = function (ValChangedInfoList,select) {

            if( select == 'A')
            {
                if(  PreviewData.GetInfoList().calculatedA == 0 ) //需要计算
                {
                    this.calculateBySelect( 'A' )
                }
            }
            else if( select=='B' )
            {
                if( PreviewData.GetInfoList().calculatedB == 0 ) //需要计算
                {
                    this.calculateBySelect( 'B' )
                }
            }
            else {
                console.log("error:"+select);
            }

            return  ValChangedInfoList.GetInfoList()[select.toString()];
        }


        this.printTempGameInfomation = function( tempGameInfo,select ){

            console.log("-----------------Temp::" + select + "::-----------------")
                for( let prop in tempGameInfo )
                {
                    console.log( prop + " : " +  tempGameInfo[prop] );
                }
                console.log("---------------------------------")
        }


        this.solveMainDataPreview = function( tempGameInfo,select  )
        {
            let pre = [0,0,0,0]; 
                let t=0;
                for( var p in getMainData()  )
                {
                    if( tempGameInfo[p] > ChangeAbleVar[p] ) pre[t]=1;
                    else if( tempGameInfo[p] < ChangeAbleVar[p] )pre[t]=-1;
                    t++;
                    
                } 

                if(select == 'A')
                {
                    PreviewData.SetInfoList({
                        calculatedA : 1,
                        A  : {
                            health: pre[0],
                            resource: pre[1],
                            budget: pre[2],
                            approval: pre[3],
                        }
                    })

                    ValChangedInfoList.SetInfoList({
                        A : tempGameInfo,
                    })
                }   
                else  if(select == 'B')
                {
                    PreviewData.SetInfoList({
                        calculatedB:1,
                        B  : {
                            health: pre[0],
                            resource: pre[1],
                            budget: pre[2],
                            approval: pre[3],
                        }
                    })

                    ValChangedInfoList.SetInfoList({
                        B : tempGameInfo,
                    })
                }
                
        }
        
    }

}
    