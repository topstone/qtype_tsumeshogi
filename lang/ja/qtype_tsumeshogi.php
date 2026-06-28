<?php
defined('MOODLE_INTERNAL') || die();

$string['pluginname']            = '詰将棋';
$string['pluginnamesummary']     = '「次の一手」形式の詰将棋問題タイプです。USI記法で採点します。';
$string['pluginname_help']       = 'SFEN形式で局面を入力し、正解手をUSI記法で設定してください。';
$string['pluginnameadding']      = '詰将棋問題の追加';
$string['pluginnameediting']     = '詰将棋問題の編集';
$string['sfen']                  = '局面（SFEN形式）';
$string['sfen_help']             = 'SFEN形式で局面を入力してください。例: 3S5/9/4k4/9/9/9/9/9/9 b S 1';
$string['correctanswer']         = '正解手（USI形式）';
$string['correctanswer_help']    = 'USI形式で正解手を入力してください。駒打ちの場合: S*5b　移動の場合: 5a4b　成りの場合: 5a4b+';
$string['correctanswerfraction'] = '得点';
$string['pleaseenterananswer']   = '駒をドラッグして手を入力してください。';
$string['yourAnswerWas']         = 'あなたの解答: {$a}';
$string['xmlimport_missingsfen']          = 'インポートされたXMLにSFENフィールドがありません。';
$string['xmlimport_missingcorrectanswer'] = 'インポートされたXMLに正解手フィールドがありません。';
