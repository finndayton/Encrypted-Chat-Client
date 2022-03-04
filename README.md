# Encrypted-Chat-Client
Encrypted chat client based on Signal's Double-Ratchet Algorithm. See Signal Spec: https://signal.org/docs/specifications/doubleratchet

Security Guarantees: 
1. Foward Secrecy: compromise of long term keys or current session key must not compromise past communications. 
2. Break-in Recovery: If an adversary manages to compromise either Alice or Bob's keys, they can still recovery from the attack at some later point in time, and the attacker will no-longer be able to decrypt messages between them. 

When no keys are stolen, semantic security is guaranteed via the underlying encryption algorithm, AES-GCM.

Concepts used: Diffie-Hellman key exchange, key generation, AES encryption, Double-Ratchet algorithm. 

This is a project based on an assignment from CS255: Cryptography at Stanford University, taught by Dan Boneh. The teaching staff provided the test suite as a sanity check, as well as lib.js. 

![Screen Shot 2022-03-04 at 1 57 16 PM](https://user-images.githubusercontent.com/59621384/156847411-f858709a-b347-4da9-8586-fb1721411fb2.png)
