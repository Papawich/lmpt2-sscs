-- Seed the 58 vessel records that were bundled with the original Figma export.
-- Safe to re-run: existing vessel IDs are left untouched.

begin;

insert into public.vessels
  (id, name, imo, call_sign, flag, port_of_registry, year_built, vessel_type, capacity, owner, operator, classification, gas_mgmt_1, gas_mgmt_2, status)
values
  (1, 'AL HAMRA', 'IMO 9074640', 'ELTL9', 'Liberia', 'Monrovia', 1997, 'Moss-Type', '137,129 m³', 'AL HAMRA LTD', 'ADNOC', 'Lloyd''s Register', 'Gas Burning', 'N/A', 'Active'),
  (2, 'Al Reef', 'IMO 9972945', '5LPF7', 'Liberia', 'Monrovia', 2025, 'Membrane', '175,009 m³', 'AL REEF LTD.', 'ADNOC Logistics & Services', 'DNV', 'Gas Burning', 'GCU', 'Active'),
  (3, 'AL SHELILA', 'IMO 9965423', '5LPF5', 'Liberia', 'Monrovia', 2024, 'Membrane', '174,838 m³', 'AL SHELILA INC', '—', 'DNV', 'GCU', 'N/A', 'Active'),
  (4, 'AMANI', 'IMO 9661869', 'V8V3146', 'Brunei Darussalam', 'Muara', 2016, 'Membrane', '155,024 m³', 'BGC Four (NBD) Sendirian Berhad', 'Brunei Gas Carrier Sendirian Berhad', 'ABS', 'Gas Burning', 'GCU', 'Active'),
  (5, 'ARISTIDIS I', 'IMO 9862906', '9HA5237', 'Malta', 'Valetta', 2021, 'Membrane', '174,007 m³', 'ATROTOS GAS CARRIER CORP.', 'CAPITAL GAS MANAGEMENT CORP.', 'Lloyd''s Register', 'Gas Burning', 'Reliq Plant', 'Active'),
  (6, 'British Listener', 'IMO 9765660', 'MAOR6', 'Isle of Man', 'Douglas', 2019, 'Membrane', '173,690 m³', 'Hai Kuo Shipping', 'Daewoo Shipbuilding and Marine Engineering', 'Lloyd''s Register', 'Gas Burning', 'GCU', 'Active'),
  (7, 'British Sponsor', 'IMO 9766580', 'MAOR4', 'Isle of Man', 'Douglas', 2019, 'Membrane', '173,690 m³', 'Natural Gas Ocean Transportation Inv. No.20', 'BP Shipping Ltd', 'Lloyd''s Register', 'Gas Burning', 'GCU', 'Active'),
  (8, 'BW HELIOS', 'IMO 9873852', '9V6826', 'Singapore', 'Singapore', 2021, 'Membrane', '174,282 m³', 'SELENE NAVIGATION Pte. Ltd', 'BW FLEET MANAGEMENT AS', 'DNV', 'Gas Burning', 'Reliq Plant', 'Active'),
  (9, 'CELSIUS CANBERRA', 'IMO 9864796', 'V7A4348', 'Marshall Islands', 'Majuro', 2021, 'Membrane', '180,260 m³', 'Xiang CH27 HK International Ship Lease Co.', 'Celsius Tech Limited', 'Lloyd''s Register', 'Gas Burning', 'GCU', 'Active'),
  (10, 'Celsius Carolina', 'IMO 9878723', 'V7A4385', 'Marshall Islands', 'Majuro', 2021, 'Membrane', '180,244 m³', 'Frigg Shipco 2 LLC', 'Celsius Tech Limited', 'Lloyd''s Register', 'Gas Burning', 'GCU', 'Active'),
  (11, 'CELSIUS GREENWICH', 'IMO 9948724', 'V7A6308', 'Marshall Islands', 'Majuro', 2024, 'Membrane', '179,999 m³', 'XIANG H24 International Ship Lease Co., Ltd', 'CELSIUS TECH LTD', 'Lloyd''s Register', 'Gas Burning', 'GCU', 'Active'),
  (12, 'Clean Cajun', 'IMO 9886732', '9HA5493', 'Malta', 'Valletta', 2022, 'Membrane', '199,830 m³', 'Platia Shipping Limited', 'Hyundai Heavy Industries', 'Bureau Veritas', 'Gas Burning', 'GCU', 'Active'),
  (13, 'Clean Destiny', 'IMO 9943487', '9HA5750', 'Malta', 'Valletta', 2023, 'Membrane', '199,881 m³', 'Green Ships Limited', 'Hyundai Heavy Industries', 'Bureau Veritas', 'Gas Burning', 'GCU', 'Active'),
  (14, 'Clean Sirocco', 'IMO 9967342', '9HA6178', 'Malta', 'Valletta', 2026, 'Membrane', '199,852 m³', 'Bright Navigation Limited', 'Dynagas Ltd', 'Bureau Veritas', 'Gas Burning', 'GCU', 'Active'),
  (15, 'Cool Explorer', 'IMO 9640023', '9HA3616', 'Malta', 'Valletta', 2015, 'Membrane', '160,562 m³', 'Safe port marine Ltd.', 'Thenamaris LNG Inc', 'DNV', 'Gas Burning', 'Gas Burning', 'Active'),
  (16, 'COOL RANGER', 'IMO 9333606', '9HA5862', 'Malta', 'Valletta', 2008, 'Membrane', '155,032 m³', 'ANEMOS VENTURES LTD', 'THENAMARIS LNG INC.', 'Lloyd''s Register', 'Reliq Plant', 'GCU', 'Active'),
  (17, 'ELISA HALCYON', 'IMO 9980552', 'FOLI', 'France', 'Marseille', 2025, 'Membrane', '174,029 m³', 'SNC Van Gogh Bail', 'Gazocean SAS', 'Bureau Veritas', 'Gas Burning', 'N/A', 'Active'),
  (18, 'Energy Atlantic', 'IMO 9649328', '9HA3976', 'Malta', 'Valletta', 2015, 'Membrane', '159,882 m³', 'Spectacle Shipping and Trading LTD', 'Alpha Gas S.A.', 'Bureau Veritas', 'Gas Burning', 'GCU', 'Active'),
  (19, 'Flex Amber', 'IMO 9857377', 'V7A2865', 'Marshall Islands', 'Majuro', 2020, 'Membrane', '174,253 m³', 'Flex LNG Amber LTD', 'Flex LNG', 'DNV', 'Gas Burning', 'GCU', 'Active'),
  (20, 'Flex Freedom', 'IMO 9862308', 'V7A2791', 'Marshall Islands', 'Majuro', 2020, 'Membrane', '173,637 m³', 'Flex Freedom Ltd', 'DSME', 'DNV', 'Gas Burning', 'GCU', 'Active'),
  (21, 'Flex Ranger', 'IMO 9709025', 'V7XI9', 'Marshall Islands', 'Majuro', 2018, 'Membrane', '174,202 m³', 'Flex LNG Ranger Ltd', 'Flex LNG Fleet Management AS', 'ABS', 'Gas Burning', 'GCU', 'Active'),
  (22, 'Gaslog Georgetown', 'IMO 9864916', 'ZCEZ2', 'Bermuda', 'Hamilton', 2020, 'Membrane GTT', '174,345 m³', 'Gas - thirty two Ltd.', 'GASLOG LNG Services Ltd', 'ABS', 'Gas Burning', 'GCU', 'Active'),
  (23, 'GASLOG ITALY', 'IMO 9962407', 'ZCHF5', 'Bermuda', 'Hamilton', 2024, 'Membrane', '174,278 m³', 'Sea 311 Leasing Co. Limited', 'Gaslog LNG Services Ltd', 'ABS', 'Gas Burning', 'Reliq Plant', 'Active'),
  (24, 'GLOBAL SEALINE', 'IMO 9880477', 'V7A4694', 'Marshall Islands', 'Majuro', 2022, 'Membrane', '174,254 m³', 'Hai Kuo Shipping 2219G Limited', 'Nakilat Shipping (Qatar) Limited', 'DNV', 'Gas Burning', 'Reliq Plant', 'Active'),
  (25, 'GREENERGY MOON', 'IMO 9961506', '9V8594', 'Singapore', 'Singapore', 2025, 'Membrane', '174,250 m³', 'COMPASS SHIPPING 118 PRIVATE LIMITED', 'MOL Global Ship Management Pte. Ltd.', 'ABS & CCS', 'Gas Burning', 'GCU', 'Active'),
  (26, 'HL Alyssa Warner', 'IMO 9972359', '5LVG2', 'Liberia', 'Monrovia', 2025, 'Membrane', '174,366 m³', 'NEPTUNE 1 S.A.', 'Northern Marine Management', 'LR & KR', 'Gas Burning', 'GCU', 'Active'),
  (27, 'HUASHAN', 'IMO 9958652', 'VRVU8', 'Hong Kong, China', 'Hong Kong', 2023, 'Membrane', '174,302 m³', 'UNITED PEACE LNG SHIPPING CO., LTD.', 'COSCO SHIPPING LNG (HK) Ship Mgmt Co.', 'ABS & CCS', 'Gas Burning', 'GCU', 'Active'),
  (28, 'IBRA LNG', 'IMO 9326689', '3EGE9', 'Panama', 'Panama', 2006, 'Membrane', '148,177 m³', 'AREEJ LNG CARRIER S.A.', 'SHI, Geoje Korea', 'NKK', 'Gas Burning', 'N/A', 'Active'),
  (29, 'JOHN A. ANGELICOUSSIS', 'IMO 9901350', 'SVDK6', 'Greece', 'Piraeus', 2022, 'Membrane', '174,204 m³', 'VARTA SHIPPING LTD. (c/o MARAN GAS)', 'MARAN GAS MARITIME INC', 'Lloyd''s Register', 'Gas Burning', 'GCU', 'Active'),
  (30, 'KITA LNG', 'IMO 9636723', '9HA3422', 'Malta', 'Valletta', 2014, 'Membrane', '160,119 m³', 'Xiang CH8 HK International Ship Lease Co.', 'Daewoo Shipbuilding and Marine Eng.', 'Bureau Veritas', 'Gas Burning', 'GCU', 'Active'),
  (31, 'KOOL BLIZZARD', 'IMO 9635315', 'V7AF2', 'Marshall Islands', 'Majuro', 2015, 'Membrane', '160,545 m³', 'Kool Blizzard Corporation', 'Samsung Heavy Industries', 'DNV', 'Gas Burning', 'GCU', 'Active'),
  (32, 'KOOL CRYSTAL', 'IMO 9624926', 'V7AF6', 'Marshall Islands', 'Majuro', 2013, 'GTT Mark III', '160,645 m³', 'KOOL HUSKY CORPORATION', 'COOL COMPANY MANAGEMENT AS', 'DNV', 'Gas Burning', 'GCU', 'Active'),
  (33, 'KOOL HUSKY', 'IMO 9626039', 'V7AF4', 'Marshall Islands', 'Majuro', 2013, 'GTT Mark III', '160,655 m³', 'KOOL HUSKY CORPORATION', 'COOL COMPANY MANAGEMENT AS', 'ABS', 'Gas Burning', 'GCU', 'Active'),
  (34, 'Kool Orca', 'IMO 9870525', 'D5XO2', 'Liberia', 'Monrovia', 2021, 'Membrane', '174,031 m³', 'Respent Marine LTD', 'Cool Company Management AS', 'DNV', 'Gas Burning', 'Reliq Plant', 'Active'),
  (35, 'LNG PROSPERITY', 'IMO 9902938', '5LCE8', 'Liberia', 'Monrovia', 2023, 'Membrane', '174,008 m³', 'MERIDIAN 28 LIMITED', 'Bernhard Schulte Shipmanagement (Hellas)', 'DNV', 'Gas Burning', 'GCU', 'Active'),
  (36, 'MALAGA KNUTSEN', 'IMO 9904182', 'FMRT', 'France (RIF)', 'Marseille', 2021, 'Membrane', '173,947 m³', 'KNUTSEN', 'MILLENAIRE FINANCEMENT', 'Lloyd''s Register', 'Gas Burning', 'Reliq Plant', 'Active'),
  (37, 'Maran Gas Delphi', 'IMO 9633173', 'SVBW3', 'Greece', 'Piraeus', 2014, 'Membrane', '159,966 m³', 'ADA SHIPHOLDING INC. (c/o MARAN GAS)', 'Maran Gas Maritime Inc.', 'ABS', 'Gas Burning', 'GCU', 'Active'),
  (38, 'Maran Gas Kalymnos', 'IMO 9883742', 'SVDI6', 'Greece', 'Piraeus', 2021, 'Membrane', '174,122 m³', 'CANTANA MARITIME CORP (c/o MARAN GAS)', 'DSME', 'ABS', 'Gas Burning', 'GCU', 'Active'),
  (39, 'Maran Gas Mystras', 'IMO 9658238', 'SVCB6', 'Greece', 'Piraeus', 2015, 'Membrane', '159,855 m³', 'BLUESKIES SHIPPING COMPANY LTD.', 'MARAN GAS MARITIME INC.', 'Lloyd''s Register', 'Gas Burning', 'GCU', 'Active'),
  (40, 'MARVEL FALCON', 'IMO 9760768', '9V5057', 'Singapore', 'Singapore', 2018, 'Membrane', '174,232 m³', 'TEA TREE SHIPPING PTE. LTD.', 'NYK SHIPMANAGEMENT PTE LTD', 'ABS', 'Gas Burning', 'GCU', 'Active'),
  (41, 'Minerva Limnos', 'IMO 9854375', '9HA5355', 'Malta', 'Valetta', 2021, 'Membrane', '173,570 m³', 'Roland Shipping S.A.', 'Minerva Gas Inc.', 'DNV', 'Gas Burning', 'GCU', 'Active'),
  (42, 'ORION MONET', 'IMO 9888766', '9HA5789', 'France', 'Marseille', 2022, 'Membrane', '174,279 m³', 'SNC STELLA LEASE', 'Bernhard Schulte Shipmanagement Hellas', 'Lloyd''s Register', 'Gas Burning', 'GCU', 'Active'),
  (43, 'PATRIS', 'IMO 9766889', 'D5NT8', 'Liberia', 'Monrovia', 2018, 'Membrane', '173,709 m³', 'Artemis Gas 1 Shipping Inc.', 'K Line Energy Shipping (UK) Ltd.', 'Lloyd''s Register', 'GCU', 'N/A', 'Active'),
  (44, 'BW PAVILION LEEARA', 'IMO 9640645', '9V2726', 'Singapore', 'Singapore', 2015, 'Membrane', '161,866 m³', 'BW PAVILION LEEARA PTE LTD', 'BW LNG AS', 'DNV', 'Gas Burning', 'GCU', 'Active'),
  (45, 'PRISM BRILLIANCE', 'IMO 9810551', '3FXT5', 'Panama', 'Panama', 2019, 'Membrane', '180,016 m³', 'HHIENS2 Shipholding S.A.', 'SK SHIPPING CO., LTD', 'KR & ABS', 'Gas Burning', 'GCU', 'Active'),
  (46, 'REX TILLERSON', 'IMO 9953248', '5LPT9', 'Liberia', 'Monrovia', 2024, 'Membrane', '174,083 m³', 'ORYX LNG No.1 SHIPPING CORPORATION', 'MOL Global Ship Management Pte. Ltd.', 'ABS & CCS', 'Gas Burning', 'GCU', 'Active'),
  (47, 'SAINT BARBARA', 'IMO 9946386', 'FMTQ', 'France', 'Marseille', 2023, 'Membrane', '174,137 m³', 'SNC CHOPIN LEASING', 'KNUTSEN OAS', 'Lloyd''s Register', 'Gas Burning', 'Reliq Plant', 'Active'),
  (48, 'SEAPEAK CREOLE', 'IMO 9681687', 'C6BF3', 'Bahamas', 'Nassau', 2016, 'Membrane', '173,480 m³', 'SEA 64 LEASING CO. LIMITED', 'SEAPEAK MARITIME (GLASGOW) LIMITED', 'DNV', 'Gas Burning', 'GCU', 'Active'),
  (49, 'Seapeak Glasgow', 'IMO 9781918', 'C6DG2', 'Bahamas', 'Nassau', 2018, 'Membrane', '174,162 m³', 'Seapeak Glasgow LLC', 'Seapeak Maritime (Glasgow) Ltd.', 'DNV', 'Gas Burning', 'Gas Burning', 'Active'),
  (50, 'Seapeak Manila', 'IMO 9770921', 'C6CH8', 'Bahamas', 'Nassau', 2018, 'Membrane', '173,579 m³', 'Hai Jiao 1606', 'Seapeak Maritime', 'DNV', 'Reliq Plant', 'GCU', 'Active'),
  (51, 'SERI CAMELLIA', 'IMO 9714276', '9MVR8', 'Malaysia', 'Port Kelang', 2013, 'Moss-Type', '150,727 m³', 'SERI CAMELLIA (L) PRIVATE LIMITED', 'SERI CAMELLIA (L) PRIVATE LIMITED', 'Lloyd''s Register', 'Gas Burning', 'N/A', 'Active'),
  (52, 'Seri Cempaka', 'IMO 9714290', '9MWM8', 'Malaysia', 'Port Kelang', 2017, 'Moss-Type', '150,547 m³', 'Seri Cempaka (L) Ptd Ltd.', 'MISC Marine', 'ABS', 'Gas Burning', 'Gas Burning', 'Active'),
  (53, 'SM EAGLE', 'IMO 9761827', '3EMX3', 'Panama', 'Panama', 2017, 'Membrane', '174,263 m³', 'SMKLC LNG1 S.A.', 'KLCSM CO., LTD.', 'KR & ABS', 'Gas Burning', 'Reliq Plant', 'Active'),
  (54, 'SOLARIS', 'IMO 9634098', 'ZCEL5', 'Bermuda', 'Hamilton', 2014, 'Membrane', '155,107 m³', 'GAS-Eight LTD', 'Gaslog LNG Services Ltd', 'ABS', 'Gas Burning', 'GCU', 'Active'),
  (55, 'TIANSHAN', 'IMO 1024754', 'VRWS4', 'Hong Kong, China', 'Hong Kong', 2026, 'Membrane', '174,257 m³', 'PCI LNG', 'COSCO SHIPPING LNG (HK) Ship Mgmt Co.', 'CCS', 'Gas Burning', 'GCU', 'Active'),
  (56, 'Woodside Donaldson', 'IMO 9369899', '9V8262', 'Singapore', 'Singapore', 2009, 'GTT Mark III', '165,758 m³', 'MALT Singapore PTE LTD', 'Seapeak Maritime Glasgow', 'Bureau Veritas', 'Gas Burning', 'GCU', 'Active'),
  (57, 'Woodside Rogers', 'IMO 9627485', 'SVBS6', 'Greece', 'Piraeus', 2013, 'Membrane', '159,847 m³', 'MARGIE SEAWAY CORPORATION INC. (c/o MARAN GAS)', 'MARAN GAS MARITIME INC', 'DNV', 'Gas Burning', 'GCU', 'Active'),
  (58, 'CELSIUS CHARLOTTE', 'IMO 9878711', 'V7A4386', 'Marshall Islands', 'Majuro', 2021, 'Membrane', '180,290 m³', 'Xiang H24 International Ship Lease Co., Ltd', 'Celsius Tech Ltd.', 'Lloyd''s Register', 'Gas Burning', 'GCU', 'Active')
on conflict (id) do nothing;

select setval(
  pg_get_serial_sequence('public.vessels', 'id'),
  greatest((select coalesce(max(id), 1) from public.vessels), 1),
  true
);

commit;
