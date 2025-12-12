// 作業記録テンプレートアップロード用スクリプト
// ブラウザの開発者ツール（F12）のコンソールで実行してください

// ファイル選択ダイアログを表示
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.xlsx,.docx';
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) {
    console.log('ファイルが選択されませんでした');
    return;
  }
  
  console.log('アップロードするファイル:', file.name);
  console.log('ファイルサイズ:', (file.size / 1024).toFixed(2), 'KB');
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('templateType', 'REPORT'); // 作業記録テンプレート
  formData.append('name', file.name.replace(/\.[^/.]+$/, '')); // 拡張子を除いたファイル名
  formData.append('description', '作業記録テンプレート');
  formData.append('isDefault', 'true'); // デフォルトテンプレートとして設定
  
  try {
    console.log('アップロード中...');
    const response = await fetch('/api/document-templates', {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ アップロード成功:', result);
      alert('テンプレートのアップロードに成功しました！\nテンプレート名: ' + result.template.name);
    } else {
      const error = await response.json();
      console.error('❌ アップロード失敗:', error);
      alert('テンプレートのアップロードに失敗しました: ' + error.error);
    }
  } catch (error) {
    console.error('❌ エラー:', error);
    alert('エラーが発生しました: ' + error.message);
  }
};

fileInput.click();

