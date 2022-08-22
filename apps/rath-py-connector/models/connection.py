from sqlalchemy import Column, Integer, String
from database import Base

class Connection(Base):
    __tablename__ = 'connection'
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=False)
    uri = Column(String(255), unique=False)
    source_type = Column(String(50), unique=False)

    def __init__(self, name=None, uri=None, source_type=None):
        self.name = name
        self.uri = uri
        self.source_type = source_type

    def __repr__(self):
        return f'<Connection {self.name!r}>'