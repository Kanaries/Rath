# DataSet

Most of the test are based on kaggle open dataset, like titanic. Dataset could be found in `/test/dataset`.

## Titanic

| **Variable** | **Definition** | **Key** |
| :--- | :--- | :--- |
| survival | Survival | 0 = No, 1 = Yes |
| pclass | Ticket class | 1 = 1st, 2 = 2nd, 3 = 3rd |
| sex | Sex |  |
| Age | Age in years |  |
| sibsp | # of siblings / spouses aboard the Titanic |  |
| parch | # of parents / children aboard the Titanic |  |
| ticket | Ticket number |  |
| fare | Passenger fare |  |
| cabin | Cabin number |  |
| embarked | Port of Embarkation | C = Cherbourg, Q = Queenstown, S = Southampton |

data config:
```json
{
  "Measures": ["Count"],
  "Dimensions": ["Age","Survived","SibSp","Parch","Fare","Name","Sex","Ticket","Cabin","Embarked","PassengerId","Pclass"]
}
```