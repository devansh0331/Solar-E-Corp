# P2P Solar Energy Trading - Documentation

## Project: **Solar-E-Corp**

---

### Folder Structure

#### 📁 `node_modules`
- Standard.

#### 📁 `public`
- Standard.

#### 📁 `src`

###### 📁 `components`
- This folder contains source files for designing the website.

###### 📁 `dashboard`
- Used for designing consumer and producer dashboards.

- All other files: Used for designing various parts of the website.

##### 📁 `contract`
- Contains the source file `Contract.sol` which includes the **smart contract**.

##### Other Files

- `App.css`: Standard.
- `App.jsx`: Renders the files in the `components` folder. Connects the website with the blockchain.
- `index.css`: Standard, with some Tailwind CSS configurations.
- `main.jsx`: Renders `App.jsx`.

---

## 🎯 Main Focus

The **primary focus** is on `Contract.sol`.  
This file will contain **critical data and code** — that is, data/code a **hacker may want to alter for financial gain**.

> **Non-critical data and code** will be moved to the **server side**.

---

# ☀️ Solar Trading Process

---

## **Step 01: Registration of Producer and Consumer**

* Producers and consumers access the system via a **GUI**.
* Registration on the blockchain is done using:

  * **Consumer:** `BB.registerAsConsumer()` → linked to **EOA\_C**
  * **Producer:** `BB.registerAsProducer()` → linked to **EOA\_P**

---

## **Step 02: Producer Sets Energy Rate and Activates Supply**

* Interested producer **p ∈ EOA\_P** sets their **energy rate** `R_p` *(in ETH/kWh)* using:

  * `BB.setEnergyRate(R_p)`
* Producer **activates supply** by providing availability parameters via:

  * `BB.activate(W_p, T_p)`
  * `W_p` = available energy capacity
  * `T_p` = supply time window

---

## **Step 03: Consumer Deposits ETH**

* Every consumer **c ∈ EOA\_C** deposits desired ETH into **BB**.

---

## **Step 04: Consumer Requests Energy**

* Consumer **c ∈ EOA\_C** selects a producer from **EOA\_P** based on availability (`W_p`, `T_p`).
* Consumer provides:

  * `W_c` = required energy
  * `t_c` = required time
* Request is sent to chosen producer.

---

## **Step 05: Producer Approves or Denies Request**

* Producer reviews the consumer’s request.
* If approved:

  * Call `BB.accept(c)`
  * Physical transmission of solar energy occurs via **electric cables**.

---

## **Step 06: Feeding Energy Data into Blockchain**

* Actual energy consumption data `M_p` is periodically recorded into **BB**.

---

## **Step 07: Billing and Settlement**

* Once consumer demand is fulfilled, **BB** automatically triggers:

  * `BB.settlePayment()`
* Billing is calculated using:

  * `M_p` = actual energy consumed
  * `R_p` = producer’s rate *(ETH/kWh)*
* **Billing Amount = M\_p × R\_p**

---

## **Step 08: Producer Receives Payment**

* Smart contract transfers the billing amount from consumer’s deposit in **BB** to the respective producer **p ∈ EOA\_P**.
 
