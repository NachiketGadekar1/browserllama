from langchain.text_splitter import RecursiveCharacterTextSplitter

text = """ """

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size = 100,
    chunk_overlap  = 20,
    length_function = len,
)
texts = text_splitter.split_text(text)
print(len(texts))
print(texts[1]) 