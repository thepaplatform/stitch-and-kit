// DMC popular needlepoint colors (~120 most-used threads) and color math helpers.
// This is pure data + pure functions — no React, no DOM.

export const DMC_COLORS = [
  { dmc: 'B5200', name: 'Snow White', hex: '#FFFFFF' },
  { dmc: 'WHITE', name: 'White', hex: '#FBFBFB' },
  { dmc: '3865', name: 'Winter White', hex: '#F5F2EB' },
  { dmc: 'ECRU', name: 'Ecru', hex: '#F0E6D2' },
  { dmc: '712', name: 'Cream', hex: '#F1E4C2' },
  { dmc: '739', name: 'Tan Ultra Vy Lt', hex: '#F5DEB8' },
  { dmc: '963', name: 'Dusty Rose Ult Vy Lt', hex: '#FDD9DC' },
  { dmc: '3713', name: 'Salmon Vy Lt', hex: '#FCD3CD' },
  { dmc: '818', name: 'Baby Pink', hex: '#FFCFD9' },
  { dmc: '776', name: 'Pink Med', hex: '#FCAEC0' },
  { dmc: '3326', name: 'Rose Lt', hex: '#F7A8B8' },
  { dmc: '899', name: 'Rose Med', hex: '#EB7C8E' },
  { dmc: '335', name: 'Rose', hex: '#D85673' },
  { dmc: '3731', name: 'Dusty Rose Vy Dk', hex: '#C75E7E' },
  { dmc: '309', name: 'Rose Dk', hex: '#AD2D49' },
  { dmc: '3805', name: 'Cyclamen Pink', hex: '#E63B7A' },
  { dmc: '3804', name: 'Cyclamen Pink Dk', hex: '#C71585' },
  { dmc: '600', name: 'Cranberry Vy Dk', hex: '#B0245B' },
  { dmc: '601', name: 'Cranberry Dk', hex: '#C73C73' },
  { dmc: '602', name: 'Cranberry Med', hex: '#D85797' },
  { dmc: '603', name: 'Cranberry', hex: '#E575B5' },
  { dmc: '604', name: 'Cranberry Lt', hex: '#F0A4CA' },
  { dmc: '605', name: 'Cranberry Vy Lt', hex: '#F8BCD4' },
  { dmc: '321', name: 'Christmas Red', hex: '#C8102E' },
  { dmc: '666', name: 'Bright Red', hex: '#E60026' },
  { dmc: '304', name: 'Red Med', hex: '#B6022C' },
  { dmc: '498', name: 'Red Dk', hex: '#A0001A' },
  { dmc: '816', name: 'Garnet', hex: '#900020' },
  { dmc: '815', name: 'Garnet Med', hex: '#8B0014' },
  { dmc: '814', name: 'Garnet Dk', hex: '#7A0014' },
  { dmc: '3801', name: 'Melon Vy Dk', hex: '#E03A4D' },
  { dmc: '722', name: 'Orange Spice Lt', hex: '#F8A468' },
  { dmc: '721', name: 'Orange Spice Med', hex: '#F08C50' },
  { dmc: '720', name: 'Orange Spice Dk', hex: '#E0631E' },
  { dmc: '947', name: 'Burnt Orange', hex: '#F47D30' },
  { dmc: '946', name: 'Burnt Orange Med', hex: '#E55B16' },
  { dmc: '740', name: 'Tangerine', hex: '#FF8C19' },
  { dmc: '741', name: 'Tangerine Med', hex: '#FFA033' },
  { dmc: '742', name: 'Tangerine Lt', hex: '#FFBD55' },
  { dmc: '743', name: 'Yellow Med', hex: '#FED15D' },
  { dmc: '744', name: 'Yellow Pale', hex: '#FCDF74' },
  { dmc: '745', name: 'Yellow Lt Pale', hex: '#FBE8A6' },
  { dmc: '746', name: 'Off White', hex: '#F7EFD4' },
  { dmc: '973', name: 'Canary Bright', hex: '#FFCB1F' },
  { dmc: '725', name: 'Topaz', hex: '#FCBA1B' },
  { dmc: '726', name: 'Topaz Lt', hex: '#FCCC44' },
  { dmc: '444', name: 'Lemon Dk', hex: '#FED800' },
  { dmc: '550', name: 'Violet Vy Dk', hex: '#6B1B5C' },
  { dmc: '552', name: 'Violet Med', hex: '#86489C' },
  { dmc: '553', name: 'Violet', hex: '#A065AD' },
  { dmc: '554', name: 'Violet Lt', hex: '#C5A8C9' },
  { dmc: '208', name: 'Lavender Vy Dk', hex: '#7E5BA2' },
  { dmc: '209', name: 'Lavender Dk', hex: '#9A7BB5' },
  { dmc: '210', name: 'Lavender Med', hex: '#B795C7' },
  { dmc: '211', name: 'Lavender Lt', hex: '#D7BFDE' },
  { dmc: '3837', name: 'Lavender Ultra Dk', hex: '#5E417C' },
  { dmc: '155', name: 'Blue Violet Dk', hex: '#8888B0' },
  { dmc: '796', name: 'Royal Blue Dk', hex: '#1B3A8C' },
  { dmc: '797', name: 'Royal Blue', hex: '#1F4DAF' },
  { dmc: '798', name: 'Delft Blue Dk', hex: '#3A6BC4' },
  { dmc: '799', name: 'Delft Blue Med', hex: '#6792D0' },
  { dmc: '800', name: 'Delft Blue Pale', hex: '#A8C0E0' },
  { dmc: '824', name: 'Blue Vy Dk', hex: '#173D6A' },
  { dmc: '825', name: 'Blue Dk', hex: '#235A92' },
  { dmc: '826', name: 'Blue Med', hex: '#4E85B5' },
  { dmc: '827', name: 'Blue Vy Lt', hex: '#BBD9F0' },
  { dmc: '336', name: 'Navy Blue', hex: '#1A2D5E' },
  { dmc: '823', name: 'Navy Blue Dk', hex: '#0E1F47' },
  { dmc: '939', name: 'Navy Blue Vy Dk', hex: '#091332' },
  { dmc: '311', name: 'Navy Blue Med', hex: '#1C355E' },
  { dmc: '517', name: 'Wedgewood Dk', hex: '#1E6391' },
  { dmc: '518', name: 'Wedgewood Lt', hex: '#3787B0' },
  { dmc: '519', name: 'Sky Blue', hex: '#88BBD8' },
  { dmc: '3843', name: 'Electric Blue', hex: '#138EC4' },
  { dmc: '995', name: 'Electric Blue Dk', hex: '#1782AE' },
  { dmc: '996', name: 'Electric Blue Med', hex: '#27AFD7' },
  { dmc: '3845', name: 'Bright Turquoise Med', hex: '#1FBBC4' },
  { dmc: '3846', name: 'Bright Turquoise Lt', hex: '#3DD0D0' },
  { dmc: '959', name: 'Sea Green Med', hex: '#7FD0C2' },
  { dmc: '964', name: 'Sea Green Lt', hex: '#A8E0D0' },
  { dmc: '958', name: 'Sea Green Dk', hex: '#43B7A6' },
  { dmc: '993', name: 'Aquamarine Lt', hex: '#9BD9C4' },
  { dmc: '992', name: 'Aquamarine', hex: '#69BFAA' },
  { dmc: '991', name: 'Aquamarine Dk', hex: '#3D8E7A' },
  { dmc: '699', name: 'Green', hex: '#005A2B' },
  { dmc: '700', name: 'Green Bright', hex: '#1A7A36' },
  { dmc: '701', name: 'Green Lt', hex: '#3A9148' },
  { dmc: '702', name: 'Kelly Green', hex: '#45A04C' },
  { dmc: '703', name: 'Chartreuse', hex: '#7CC25A' },
  { dmc: '704', name: 'Chartreuse Bright', hex: '#A8D55D' },
  { dmc: '907', name: 'Parrot Green Lt', hex: '#C2D75D' },
  { dmc: '906', name: 'Parrot Green Med', hex: '#9CC050' },
  { dmc: '905', name: 'Parrot Green Dk', hex: '#6F933D' },
  { dmc: '904', name: 'Parrot Green Vy Dk', hex: '#4D7126' },
  { dmc: '470', name: 'Avocado Green Lt', hex: '#7E9742' },
  { dmc: '471', name: 'Avocado Green Vy Lt', hex: '#9DB05B' },
  { dmc: '472', name: 'Avocado Green Ult Lt', hex: '#C2D087' },
  { dmc: '988', name: 'Forest Green Med', hex: '#578553' },
  { dmc: '987', name: 'Forest Green Dk', hex: '#3F6E3C' },
  { dmc: '986', name: 'Forest Green Vy Dk', hex: '#2B4F2A' },
  { dmc: '500', name: 'Blue Green Vy Dk', hex: '#0F3F2B' },
  { dmc: '561', name: 'Jade Vy Dk', hex: '#1F634F' },
  { dmc: '562', name: 'Jade Med', hex: '#388A6C' },
  { dmc: '563', name: 'Jade Lt', hex: '#6BB590' },
  { dmc: '564', name: 'Jade Vy Lt', hex: '#A0D2B0' },
  { dmc: '433', name: 'Brown Med', hex: '#7B4F2C' },
  { dmc: '434', name: 'Brown Lt', hex: '#945C2C' },
  { dmc: '435', name: 'Brown Vy Lt', hex: '#B07740' },
  { dmc: '436', name: 'Tan', hex: '#C49263' },
  { dmc: '437', name: 'Tan Lt', hex: '#D6B07B' },
  { dmc: '738', name: 'Tan Vy Lt', hex: '#E7CCA4' },
  { dmc: '801', name: 'Coffee Brown Dk', hex: '#5C3317' },
  { dmc: '898', name: 'Coffee Brown Vy Dk', hex: '#4B2A14' },
  { dmc: '938', name: 'Coffee Brown Ult Dk', hex: '#3B1F0F' },
  { dmc: '310', name: 'Black', hex: '#000000' },
  { dmc: '3799', name: 'Pewter Vy Dk', hex: '#363636' },
  { dmc: '413', name: 'Pewter Dk', hex: '#4F4F4F' },
  { dmc: '414', name: 'Steel Med', hex: '#6E6E6E' },
  { dmc: '415', name: 'Pearl Gray', hex: '#C0C0C0' },
  { dmc: '762', name: 'Pearl Gray Vy Lt', hex: '#DEDEDE' },
  { dmc: '648', name: 'Beaver Gray Lt', hex: '#A8A8A0' },
  { dmc: '844', name: 'Beaver Gray Ult Dk', hex: '#3D3938' },
  { dmc: '676', name: 'Old Gold Lt', hex: '#E4C28A' },
  { dmc: '729', name: 'Old Gold Med', hex: '#CFA565' },
  { dmc: '680', name: 'Old Gold Dk', hex: '#A77E2E' },
  // ---- Extended palette (added for better color matching) ----
  // Pinks, salmons, corals
  { dmc: '151', name: 'Pink Vy Lt', hex: '#EFCDC8' },
  { dmc: '3716', name: 'Dusty Rose Lt', hex: '#F4ABB7' },
  { dmc: '3354', name: 'Dusty Rose Md Lt', hex: '#E69BAA' },
  { dmc: '3733', name: 'Dusty Rose', hex: '#DB8898' },
  { dmc: '760', name: 'Salmon', hex: '#F1A8A3' },
  { dmc: '761', name: 'Salmon Lt', hex: '#F6B8B0' },
  { dmc: '3712', name: 'Salmon Med', hex: '#F08080' },
  { dmc: '3328', name: 'Salmon Dk', hex: '#DD7474' },
  { dmc: '347', name: 'Salmon Vy Dk', hex: '#B6322F' },
  { dmc: '754', name: 'Peach Lt', hex: '#F5C8B0' },
  { dmc: '353', name: 'Peach', hex: '#F8B69E' },
  { dmc: '352', name: 'Coral Lt', hex: '#ED8276' },
  { dmc: '351', name: 'Coral', hex: '#DC4D40' },
  { dmc: '350', name: 'Coral Med', hex: '#D24737' },
  { dmc: '349', name: 'Coral Dk', hex: '#B6332A' },
  { dmc: '3831', name: 'Raspberry Dk', hex: '#B83A41' },
  { dmc: '3832', name: 'Raspberry Med', hex: '#C95E66' },
  { dmc: '3833', name: 'Raspberry Lt', hex: '#D88787' },
  { dmc: '902', name: 'Garnet Vy Dk', hex: '#741B0F' },
  // Blues
  { dmc: '322', name: 'Baby Blue Dk', hex: '#506FB2' },
  { dmc: '312', name: 'Navy Blue Lt', hex: '#1A4577' },
  { dmc: '813', name: 'Blue Lt', hex: '#82A6CE' },
  { dmc: '794', name: 'Cornflower Blue Lt', hex: '#91A8D0' },
  { dmc: '793', name: 'Cornflower Blue Med', hex: '#6680B6' },
  { dmc: '792', name: 'Cornflower Blue Dk', hex: '#4B6E9B' },
  { dmc: '791', name: 'Cornflower Blue Vy Dk', hex: '#2D497E' },
  { dmc: '158', name: 'Cornflower Blue Med Dk', hex: '#3D4E70' },
  { dmc: '159', name: 'Gray Blue Lt', hex: '#B6C0D2' },
  { dmc: '160', name: 'Gray Blue Med', hex: '#A6B5CC' },
  { dmc: '161', name: 'Gray Blue Dk', hex: '#7D8FB8' },
  { dmc: '162', name: 'Blue Ult Vy Lt', hex: '#CFDEEF' },
  { dmc: '3325', name: 'Baby Blue Lt', hex: '#A4C6E3' },
  { dmc: '3839', name: 'Lavender Blue Med', hex: '#6973A6' },
  { dmc: '3840', name: 'Lavender Blue Lt', hex: '#95A4D0' },
  { dmc: '3841', name: 'Pale Baby Blue', hex: '#B6CEE5' },
  // Greens
  { dmc: '320', name: 'Pistachio Green Med', hex: '#608C5C' },
  { dmc: '367', name: 'Pistachio Green Dk', hex: '#4F7950' },
  { dmc: '368', name: 'Pistachio Green Lt', hex: '#98BD83' },
  { dmc: '369', name: 'Pistachio Green Vy Lt', hex: '#CDDEAD' },
  { dmc: '3346', name: 'Hunter Green', hex: '#71915D' },
  { dmc: '3347', name: 'Yellow Green Med', hex: '#79954C' },
  { dmc: '3348', name: 'Yellow Green Lt', hex: '#C0D29C' },
  { dmc: '522', name: 'Fern Green', hex: '#A1AC85' },
  { dmc: '523', name: 'Fern Green Lt', hex: '#B0B98C' },
  { dmc: '524', name: 'Fern Green Vy Lt', hex: '#B9C2A0' },
  { dmc: '520', name: 'Fern Green Dk', hex: '#6F7A48' },
  { dmc: '469', name: 'Avocado Green', hex: '#647433' },
  { dmc: '936', name: 'Avocado Green Vy Dk', hex: '#4F602B' },
  { dmc: '989', name: 'Forest Green', hex: '#7FA56E' },
  { dmc: '3818', name: 'Emerald Green Ult Vy Dk', hex: '#005C2B' },
  { dmc: '943', name: 'Aquamarine Med', hex: '#4DA999' },
  // Yellows / golds
  { dmc: '307', name: 'Lemon', hex: '#FFE547' },
  { dmc: '727', name: 'Topaz Vy Lt', hex: '#FCE4A7' },
  { dmc: '728', name: 'Topaz', hex: '#E5C75D' },
  { dmc: '783', name: 'Topaz Med', hex: '#C29133' },
  { dmc: '782', name: 'Topaz Dk', hex: '#A4742F' },
  { dmc: '781', name: 'Topaz Vy Dk', hex: '#A06C2C' },
  { dmc: '780', name: 'Topaz Ult Vy Dk', hex: '#7D4C19' },
  // Purples / violets
  { dmc: '327', name: 'Violet Dk', hex: '#553278' },
  { dmc: '333', name: 'Blue Violet Vy Dk', hex: '#5F4593' },
  { dmc: '340', name: 'Blue Violet Med', hex: '#9586B8' },
  { dmc: '341', name: 'Blue Violet Lt', hex: '#B5AFD0' },
  { dmc: '153', name: 'Violet Vy Lt', hex: '#E1B6CC' },
  { dmc: '3041', name: 'Antique Violet Med', hex: '#9988A1' },
  { dmc: '3042', name: 'Antique Violet Lt', hex: '#B5A8B5' },
  // Neutrals / browns / mochas / grays
  { dmc: '3023', name: 'Brown Gray Lt', hex: '#B9AC95' },
  { dmc: '3022', name: 'Brown Gray Med', hex: '#918B7A' },
  { dmc: '3024', name: 'Brown Gray Vy Lt', hex: '#C9C3B2' },
  { dmc: '3032', name: 'Mocha Brown Med', hex: '#A28B72' },
  { dmc: '3033', name: 'Mocha Brown Vy Lt', hex: '#DAC9AF' },
  { dmc: '3782', name: 'Mocha Brown Lt', hex: '#B59D7B' },
  { dmc: '3787', name: 'Brown Gray Dk', hex: '#6A6657' },
  { dmc: '3790', name: 'Beige Gray Ult Dk', hex: '#6D5E4F' },
  { dmc: '3866', name: 'Mocha Brown Ult Vy Lt', hex: '#ECE3CB' },
  { dmc: '642', name: 'Beige Gray Med Dk', hex: '#877964' },
  { dmc: '644', name: 'Beige Gray Med', hex: '#BBB29A' },
  { dmc: '822', name: 'Beige Gray Lt', hex: '#DDD3B6' },
  { dmc: '3072', name: 'Beaver Gray Vy Lt', hex: '#B7B6A8' },
  { dmc: '645', name: 'Beaver Gray Vy Dk', hex: '#5D584F' },
  { dmc: '646', name: 'Beaver Gray Med Dk', hex: '#6E6A5C' },
  { dmc: '647', name: 'Beaver Gray Med', hex: '#888473' },
  { dmc: '535', name: 'Ash Gray Vy Lt', hex: '#4D4F45' },
  { dmc: '612', name: 'Drab Brown Med', hex: '#A28B6B' },
  { dmc: '613', name: 'Drab Brown Lt', hex: '#C0AC8B' },
  { dmc: '3858', name: 'Rosewood Med', hex: '#965B47' },
  { dmc: '3859', name: 'Rosewood Lt', hex: '#BB8170' },
  { dmc: '3860', name: 'Cocoa', hex: '#876959' },
  { dmc: '3861', name: 'Cocoa Lt', hex: '#A48172' },
];

// Symbols for B&W chart printing — each palette index gets a unique mark.
export const SYMBOLS = ['◆','●','▲','■','★','✚','♦','✦','◯','□','△','▽','◎','◐','◑','◒','◓','♥','♣','♠'];

export const hexToRgb = (hex) => {
  const m = hex.replace('#','').match(/.{2}/g);
  return m ? m.map(x => parseInt(x, 16)) : [0,0,0];
};

export const rgbToHex = (r, g, b) =>
  '#' + [r,g,b].map(x => Math.round(x).toString(16).padStart(2,'0')).join('');

export const getSaturation = (r, g, b) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
};

export const closestColor = (pixel, pal) => {
  let minDist = Infinity, minIdx = 0;
  for (let i = 0; i < pal.length; i++) {
    const c = pal[i];
    const d = (pixel[0]-c[0])**2 + (pixel[1]-c[1])**2 + (pixel[2]-c[2])**2;
    if (d < minDist) { minDist = d; minIdx = i; }
  }
  return minIdx;
};

// K-means++ initialization + standard k-means for color quantization.
export const quantize = (pixels, k) => {
  if (pixels.length === 0 || k === 0) return [];
  const centroids = [pixels[Math.floor(Math.random() * pixels.length)]];
  for (let i = 1; i < k; i++) {
    const distances = pixels.map(p => {
      let minDist = Infinity;
      for (const c of centroids) {
        const d = (p[0]-c[0])**2 + (p[1]-c[1])**2 + (p[2]-c[2])**2;
        if (d < minDist) minDist = d;
      }
      return minDist;
    });
    const total = distances.reduce((a,b) => a+b, 0);
    if (total === 0) { centroids.push(pixels[Math.floor(Math.random() * pixels.length)]); continue; }
    let r = Math.random() * total;
    let idx = 0;
    for (let j = 0; j < distances.length; j++) { r -= distances[j]; if (r <= 0) { idx = j; break; } }
    centroids.push(pixels[idx]);
  }
  for (let iter = 0; iter < 15; iter++) {
    const clusters = Array.from({length: k}, () => []);
    for (const p of pixels) {
      let minDist = Infinity, minIdx = 0;
      for (let i = 0; i < centroids.length; i++) {
        const c = centroids[i];
        const d = (p[0]-c[0])**2 + (p[1]-c[1])**2 + (p[2]-c[2])**2;
        if (d < minDist) { minDist = d; minIdx = i; }
      }
      clusters[minIdx].push(p);
    }
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue;
      const sum = clusters[i].reduce((a,b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]], [0,0,0]);
      centroids[i] = [sum[0]/clusters[i].length, sum[1]/clusters[i].length, sum[2]/clusters[i].length];
    }
  }
  return centroids.map(c => c.map(v => Math.round(v)));
};
