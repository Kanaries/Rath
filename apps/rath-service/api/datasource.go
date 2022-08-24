package api

import (
	"rath-service/global"
	"rath-service/models"
	"rath-service/services"

	"github.com/gin-gonic/gin"
)

func CreateDataSource(ctx *gin.Context) {
	var ds models.IDataSource
	ctx.Bind(&ds)
	result := global.RATH_DB.Create(&ds)
	if result.Error != nil {
		services.SendErrorResponse(ctx, result.Error.Error())
		return
	}
	services.SendSuccessResponse(ctx, ds.ID)
}
