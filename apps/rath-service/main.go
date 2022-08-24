package main

import (
	"rath-service/api"
	"rath-service/global"
	"rath-service/initialize"

	"github.com/gin-gonic/gin"
)

func main() {
	app := gin.New()
	global.RATH_DB = initialize.InitDB()
	apiGroup := app.Group("/api")
	{
		apiGroup.GET("/datasource/create", api.CreateDataSource)
	}
	app.Run(":2019")
}
