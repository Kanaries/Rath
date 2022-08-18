from sqlalchemy import Column, Integer, String
from database import Base

class Connection(Base):
    __tablename__ = 'connection'
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=False)
    uri = Column(String(255), unique=False)

    def __init__(self, name=None, email=None):
        self.name = name
        self.uri = ""

    def __repr__(self):
        return f'<Connection {self.name!r}>'