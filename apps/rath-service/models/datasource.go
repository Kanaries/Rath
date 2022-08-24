package models

import "gorm.io/gorm"

type IDataSource struct {
	gorm.Model
	Name       string
	SourceType string
	URI        string
}
