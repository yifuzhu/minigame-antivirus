const ConstVar = require("./js_constant");

class GameVarible
{
    constructor()
    {

        
        N = 100000 //initial population
        beta0 = 0.3  // virus's inherent infection rate
        gamma0 = 0.07 // virus's inherent recovery rate

        //initial conditions: 100 infected, no death,  rest susceptible
        I0 = 100
        S0 = N-I0
        R0 = 0  
        D0 = 0 

        //failure condition: 70% of the population is infected
        If = 0.7 * N

        //initial death rate
        dDdt = 0.001

        //initial Health
        Health = 100

        //initial Resource
        Resources = 50

        //initial Financials
        Financials = 50

        //initial Support
        Support = 50

        //initial quarantine region
        qc = 500 //quanrantine capacity
        qr = 0.05 //quarantine rate
        qn = Math.min(qc, qr*I0) //number of ppl in quarantine

        //initial resource output productivty
        prod0 = 1

        //initial supprt rate change
        dsup0 = 0.3

        //initial daily resource consumption 
        redaily = 1

        //initial daily financals consumption
        findaily = 0

        //initial state vector
        curr = [Health, Resources, Financials, Support, beta0, gamma0, 
            S0, I0, R0, qc, qr, qn, D0, dDdt, prod0, dsup0, N, redaily, findaily]

    }

    calculateGameVar(  ){

        this.updateSIR(curr[6], curr[7], curr[8], beta0, gamma0, curr[16])
        this.updateND(this.I, curr[16], curr[12], curr[13])
        this.updateHealth(this.I0, this.I, this.If)
        this.updateResources(curr[14], curr[1], curr[17])
        this.updateFinancials(curr[2], curr[18])
        this.updateSupport(curr[3], curr[15])
        this.updateQuarantine(curr[9], curr[10], curr[11])
        curr = [this.Health, this.Resources, this.Financials, this.Support, this.beta0, this.gamma0, 
                this.S0, this.I0, this.R0, this.qc, this.qr, this.qn, this.D0, this.dDdt, this.prod0, 
                this.dsup0, this.N, this.redaily, this.findaily]
    }
    
    captureCardChangedVal( cardChangedVal )
    {
     
        //a = [0,0.5];
        for( let v in cardChangedVal ) 
        {
            if( cardChangedVal[v][0] != 0 ){
                this[v.toString()] += cardChangedVal[v][0];
            }
            else{
                this[v.toString()] = cardChangedVal[v][1];
            }

            /*console.log( "V:" + v + " [0]: " + cardChangedVal[v][0]+
                            " [1]: " + cardChangedVal[v][1] + "--" +
                            this[v.toString()]);*/
        }
    }

    getMainData () {
        return {
            'health':Health,
            'budget':Financials,
            'resource':Resources,
            'approval':Support,
            //'Health': this.health,
            //'Resources' : this.Resources,
            //'Financials' : this.Financials,
            // 'Support' : this.Support,
        };
    }

    getAssistParameter(){
        
            return {
                'dayCount':0, //当前天数
                'hoursCount':0, //小时数
            
                'infectedCount':0, //当前感染人数 
                'infectionRate':0, //感染率
                'dailyInfection':0,  //日感染人数
                
                'recoveryRate': 0,  //治愈率
                'resourceProductivity':0, //？
                'resourceConsumption':0, //？
                'resourceDailyChange':0, //资源日增减
            
                'dailyRecovery':0,   //日治愈人数
            
                'quarantineCapacity':0,    //隔离区容量
                'quarantineRate':0,  //隔离率
                'quarantineCount':0, //隔离人数
                
                'budgetDailyChange':0,   //财政日增减
                'approvalDailyChange':0,//支持率日增减
                'shutdown':0,    //封城 是1否0
            }
        
        //return curr;
    }

    updatedD(I, N, dDdt) 
    {
    // Assume the medical resources can support 5% of the population, if we go beyond that threshold, the death rate goes up 0.001 per percentage point
    // This condition is arbitrary.
    if ((I/N) > 0.05)
        this.dDdt += 0.001 * ((I/N) - 0.05);
    return;
    }

    updateND(I, N, D, dDdt)
    {
    dDdt = this.updatedD(I, N, dDdt)
    this.D = I * dDdt
    this.N = N - D
    return;
    }

    deriv(S, I, R, N, beta, gamma)
    {
    this.dSdt = -beta * S * I / N
    this.dIdt = beta * S * I / N - gamma * I
    this.dRdt = gamma * I
    return;
    }

    updateSIR(S0, I0, R0, beta, gamma, N)
    {
    //dS, dI, dR = deriv(S0, I0, R0, N, beta, gamma)
    //dI = deriv(S0, I0, R0, N, beta, gamma).ds
    this.deriv(S0, I0, R0, N, beta, gamma)
    
    // delta t = 1
    this.S0 = dSdt + S0
    this.I0 = dIdt + I0
    this.R0 = dRdt + R0
    return;
    }

    updateHealth(I0, I, If){
    if (I >= 1)
        this.Health = 100 - Math.max((Math.log2(I) - Math.log2(I0))/
                    (Math.log2(If)- Math.log2(I0))*100, 1)
    else   this.Health = 99
    return;
    }

    updatedsup(dsup, I, N)
    {
    if ((I/N)< 0.1)
        this.dsup = 0.3;
    else
        this.dsup = -1;
    return;
    }

    updateSupport(Support, dsup)
    {
    this.Support = Support + dsup;
    this.dsup = dsup;
    return;
    }

    updateFinancials(Financials, findaily)
    {
    this.Financials = Financials + findaily
    return;
    }

    updateResources(prod, Resources, redaily)
    {
    this.Resources = Resources - redaily + prod
    return;
    }

    updateQuarantine(qc, qr, qn)
    {
    this.qn = Math.min(qc, (qr * I))
    return;
    }


    getGameVaribleAllNumber(){
        return Object.assign(getAssistParameter() ,getMainData());
    }


    /*get N(){
        return this.N;
    };
    get beta0(){
        return this.beta0;
    };
    get gamma0()
    {
        return this.gamma0;
    }
   
    get I0(){
        return this.I0;
    }; 
    get S0(){
        return this.S0;
    }; 
    get R0(){
        return this.R0;
    }; 
    get D0(){
        return this.D0;
    }; 
   
    get  If(){
        return  this.If;
    };  
    get dDdt(){
        return this.dDdt;
    };
    get Health(){
        return this.Health;
    };  
    get Resources(){
        return this.Resources;
    }; 
    get Financials(){
        return this.Financials;
    }; 
    get qc(){
        return this.qc;
    }; 
    get qr(){
        return this.qr;
    }; 
    get qn(){
        return this.qn;
    }; 
    get prod0(){
        return this.prod0;
    }; 
    get dsup0(){
        return this.dsup0;
    }; 
    get redaily(){
        return this.redaily;
    }; 
    get findaily(){
        return this.findaily;
    }; 
    get curr(){
        return this.curr;
    }; 


    //set
    set N( arg ){
        N= arg;
    };
    set beta0( arg){
        beta0 = arg;
    };
    set gamma0( arg)
    {
        gamma0 = arg;
    }
    
    set I0(arg){
        I0 = arg;
    }; 
    set S0 (arg){
        S0 = arg;
    }; 
    set R0(arg){
        R0 = arg;
    }; 
    set D0(arg){
        D0 = arg;
    }; 
   
    set  If(arg){
        If = arg;
    };  
    set dDdt(arg){
        dDdt = arg;
    };
    set Health(arg){
        Health= arg;
    };  
    set Resources(arg){
        Resources = arg ;
    }; 
    set Financials(arg){
        Financials = arg;
    }; 
    set Support(arg){
        Support = arg;
    }; 
    set qc(arg){
        qc = arg;
    }; 
    set qr(arg){
        qr = arg;
    }; 
    set qn(arg){
        qn= arg;
    }; 
    set prod0(arg){
        prod0= arg;
    }; 
    set dsup0(arg){
        dsup0= arg;
    }; 
    set redaily(arg){
        redaily= arg;
    }; 
    set findaily(arg){
        findaily= arg;
    };   
*/
}


module.exports = 
{
    GameVarible 
}





