export default{
    routes:[
        {
            method:"POST",
            path:"/auth/register",
            handler:"controller.register",
            config:{
                policies:[]
            }
        }
    ]
}