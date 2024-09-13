import semchunk
from transformers import AutoTokenizer
import tiktoken

chunk_size = 100
text = 'Mission Unix’s history is long—much longer than NT’s. Unix’s development started in 1969 and its primary goal was to be a convenient platform for programmers. Unix was inspired by Multics, but compared to that other system, Unix focused on simplicity which is a trait that let it triumph over Multics. Portability and multitasking were not original goals of the Unix design though: these features were retrofitted in the many “forks” and reinventions of Unix years later.On Microsoft’s side, the first release of MS-DOS launched in August 1981 and the first release of “legacy Windows” (the DOS-based editions) launched in November 1985. While MS-DOS was a widespread success, it wasn’t until Windows 3.0 in May 1990 that Windows started to really matter. Windows NT was conceived in 1989 and saw the light with the NT 3.1 release in July 1993.This timeline gave Microsoft an edge: the design of NT started 20 years after Unix’s, and Microsoft already had a large user base thanks to MS-DOS and legacy Windows. The team at Microsoft designing NT had the hindsight of these developments, previous experience developing other operating systems, and access to more modern technology, so they could “shoot for the moon” with the creation of NT.In particular, NT started with the following design goals as part of its mission, which are in stark contrast to Unix’s:'

chunker = semchunk.chunkerify('umarbutler/emubert', chunk_size) or \
          semchunk.chunkerify('gpt-4', chunk_size) or \
          semchunk.chunkerify('cl100k_base', chunk_size) or \
          semchunk.chunkerify(AutoTokenizer.from_pretrained('umarbutler/emubert'), chunk_size) or \
          semchunk.chunkerify(tiktoken.encoding_for_model('gpt-4'), chunk_size) or \
          semchunk.chunkerify(lambda text: len(text.split()), chunk_size)

if __name__ == '__main__':
    # Print results instead of using asserts
    print(chunker(text))  # Output for single text
    print(chunker([text], progress=True))  # Output for list of texts
    print(chunker([text], processes=2))  # Output with multiprocessing
